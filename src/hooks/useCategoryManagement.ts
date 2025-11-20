import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { clearCategorizationCache } from '@/services/biomarkerCategoryService';
import { SIMPLIFIED_CATEGORIES, CATEGORY_DISPLAY_NAMES, mapJsonCategoryToSimplified, SimplifiedCategory } from '@/utils/categoryMapping';
import biomarkerSpec from '@/data/biomarker-specification.json';
import { toast } from 'sonner';

export interface BiomarkerData {
  name: string;
  displayOrder: number;
  hasOverride: boolean;
  overrideId?: string;
}

export interface CategoryData {
  name: string;
  displayName: string;
  biomarkers: BiomarkerData[];
  order: number;
}

interface PendingChanges {
  categoryOrder: CategoryData[] | null;
  biomarkerReorders: Map<string, BiomarkerData[]>;
  biomarkerRenames: Map<string, { newName: string; category: string; oldName: string }>;
  biomarkerAdditions: Array<{ name: string; category: string }>;
  biomarkerDeletions: Set<string>;
  biomarkerMoves: Map<string, string>;
}

export function useCategoryManagement() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overrides, setOverrides] = useState<Map<string, any>>(new Map());
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({
    categoryOrder: null,
    biomarkerReorders: new Map(),
    biomarkerRenames: new Map(),
    biomarkerAdditions: [],
    biomarkerDeletions: new Set(),
    biomarkerMoves: new Map(),
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      // Buscar overrides do banco
      const { data: overridesData, error } = await supabase
        .from('biomarker_category_overrides')
        .select('*')
        .order('display_order');

      if (error) throw error;

      // Buscar ordem customizada das categorias
      const { data: categoryOrderData, error: orderError } = await supabase
        .from('category_display_order')
        .select('*')
        .order('display_order');

      if (orderError) throw orderError;

      // Criar mapa de overrides
      const overridesMap = new Map();
      overridesData?.forEach(override => {
        overridesMap.set(override.biomarker_name, override);
      });
      setOverrides(overridesMap);

      // Criar mapa de ordem de categorias customizada
      const categoryOrderMap = new Map();
      categoryOrderData?.forEach(order => {
        categoryOrderMap.set(order.category_key, order.display_order);
      });

      // 🔥 MUDANÇA PRINCIPAL: Agrupar biomarcadores do JSON por categoria simplificada
      const biomarkersByCategory: Record<string, string[]> = {};
      
      // Inicializar todas as categorias vazias
      SIMPLIFIED_CATEGORIES.forEach(cat => {
        biomarkersByCategory[cat] = [];
      });

      // Agrupar biomarcadores do JSON
      biomarkerSpec.biomarcadores.forEach((bio: any) => {
        const simplifiedCategory = mapJsonCategoryToSimplified(bio.categoria);
        biomarkersByCategory[simplifiedCategory].push(bio.nome_padrao);
      });

      // Criar estrutura de categorias
      let categoriesData: CategoryData[] = SIMPLIFIED_CATEGORIES.map((categoryKey, index) => {
        const biomarkersInCategory = biomarkersByCategory[categoryKey] || [];
        
        const biomarkers: BiomarkerData[] = biomarkersInCategory.map((biomarkerName, bioIndex) => {
          const override = overridesMap.get(biomarkerName);
          return {
            name: biomarkerName,
            displayOrder: override?.display_order ?? bioIndex,
            hasOverride: !!override,
            overrideId: override?.id
          };
        });

        // Adicionar biomarcadores que têm override para esta categoria mas não estão no JSON
        overridesData?.forEach(override => {
          if (override.category === categoryKey && !biomarkers.find(b => b.name === override.biomarker_name)) {
            biomarkers.push({
              name: override.biomarker_name,
              displayOrder: override.display_order ?? 999,
              hasOverride: true,
              overrideId: override.id
            });
          }
        });

        // Ordenar por display_order
        biomarkers.sort((a, b) => a.displayOrder - b.displayOrder);

        return {
          name: categoryKey,
          displayName: CATEGORY_DISPLAY_NAMES[categoryKey as SimplifiedCategory],
          biomarkers,
          order: categoryOrderMap.get(categoryKey) ?? index
        };
      });

      // Ordenar categorias pela ordem customizada
      categoriesData.sort((a, b) => a.order - b.order);

      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const updateBiomarkerName = (oldName: string, newName: string, category: string) => {
    setPendingChanges(prev => {
      const newRenames = new Map(prev.biomarkerRenames);
      newRenames.set(oldName, { newName, category, oldName });
      return { ...prev, biomarkerRenames: newRenames };
    });
    
    setCategories(prev => prev.map(cat => {
      if (cat.name === category) {
        return {
          ...cat,
          biomarkers: cat.biomarkers.map(b => 
            b.name === oldName ? { ...b, name: newName } : b
          )
        };
      }
      return cat;
    }));
    
    setHasUnsavedChanges(true);
  };

  const moveBiomarker = (biomarkerName: string, newCategory: string) => {
    setPendingChanges(prev => {
      const newMoves = new Map(prev.biomarkerMoves);
      newMoves.set(biomarkerName, newCategory);
      return { ...prev, biomarkerMoves: newMoves };
    });
    
    // ✅ Atualizar UI instantaneamente: remover da categoria antiga e adicionar na nova
    setCategories(prev => {
      let biomarkerToMove: BiomarkerData | null = null;
      let oldCategory: string | null = null;
      
      // 1️⃣ Encontrar e remover o biomarcador da categoria atual
      const withoutBiomarker = prev.map(cat => {
        const foundBiomarker = cat.biomarkers.find(b => b.name === biomarkerName);
        if (foundBiomarker) {
          biomarkerToMove = foundBiomarker;
          oldCategory = cat.name;
          return {
            ...cat,
            biomarkers: cat.biomarkers.filter(b => b.name !== biomarkerName)
          };
        }
        return cat;
      });
      
      // 2️⃣ Adicionar na nova categoria
      if (biomarkerToMove && oldCategory !== newCategory) {
        return withoutBiomarker.map(cat => {
          if (cat.name === newCategory) {
            return {
              ...cat,
              biomarkers: [...cat.biomarkers, { ...biomarkerToMove!, hasOverride: true }]
            };
          }
          return cat;
        });
      }
      
      return withoutBiomarker;
    });
    
    setHasUnsavedChanges(true);
  };

  const reorderBiomarkers = (category: string, biomarkers: BiomarkerData[]) => {
    setPendingChanges(prev => {
      const newReorders = new Map(prev.biomarkerReorders);
      newReorders.set(category, biomarkers);
      return { ...prev, biomarkerReorders: newReorders };
    });
    
    setCategories(prev => prev.map(cat => 
      cat.name === category ? { ...cat, biomarkers } : cat
    ));
    
    setHasUnsavedChanges(true);
  };

  const addBiomarker = (biomarkerName: string, category: string) => {
    setPendingChanges(prev => ({
      ...prev,
      biomarkerAdditions: [...prev.biomarkerAdditions, { name: biomarkerName, category }]
    }));
    
    setCategories(prev => prev.map(cat => {
      if (cat.name === category) {
        return {
          ...cat,
          biomarkers: [...cat.biomarkers, { 
            name: biomarkerName, 
            displayOrder: 999, 
            hasOverride: true 
          }]
        };
      }
      return cat;
    }));
    
    setHasUnsavedChanges(true);
  };

  const removeBiomarker = (biomarkerName: string) => {
    setPendingChanges(prev => {
      const newDeletions = new Set(prev.biomarkerDeletions);
      newDeletions.add(biomarkerName);
      return { ...prev, biomarkerDeletions: newDeletions };
    });
    
    setCategories(prev => prev.map(cat => ({
      ...cat,
      biomarkers: cat.biomarkers.filter(b => b.name !== biomarkerName)
    })));
    
    setHasUnsavedChanges(true);
  };

  const reorderCategories = (reorderedCategories: CategoryData[]) => {
    setPendingChanges(prev => ({
      ...prev,
      categoryOrder: reorderedCategories
    }));
    
    setCategories(reorderedCategories);
    setHasUnsavedChanges(true);
  };

  const saveAllChanges = async () => {
    try {
      // 1. Processar remoções primeiro
      if (pendingChanges.biomarkerDeletions.size > 0) {
        const deletions = Array.from(pendingChanges.biomarkerDeletions);
        for (const biomarkerName of deletions) {
          await supabase
            .from('biomarker_category_overrides')
            .delete()
            .eq('biomarker_name', biomarkerName);
        }
      }

      // 2. Processar renomeações
      if (pendingChanges.biomarkerRenames.size > 0) {
        for (const [oldName, { newName, category }] of pendingChanges.biomarkerRenames) {
          const override = overrides.get(oldName);
          
          if (override) {
            await supabase
              .from('biomarker_category_overrides')
              .update({ biomarker_name: newName })
              .eq('id', override.id);
          } else {
            await supabase
              .from('biomarker_category_overrides')
              .insert({
                biomarker_name: newName,
                category: category,
                display_order: 999
              });
          }
        }
      }

      // 3. Processar movimentações entre categorias
      if (pendingChanges.biomarkerMoves.size > 0) {
        for (const [biomarkerName, newCategory] of pendingChanges.biomarkerMoves) {
          const override = overrides.get(biomarkerName);
          
          if (override) {
            await supabase
              .from('biomarker_category_overrides')
              .update({ category: newCategory })
              .eq('id', override.id);
          } else {
            await supabase
              .from('biomarker_category_overrides')
              .insert({
                biomarker_name: biomarkerName,
                category: newCategory,
                display_order: 999
              });
          }
        }
      }

      // 4. Processar adições
      if (pendingChanges.biomarkerAdditions.length > 0) {
        const insertions = pendingChanges.biomarkerAdditions.map(({ name, category }) => ({
          biomarker_name: name,
          category: category,
          display_order: 999
        }));
        
        await supabase
          .from('biomarker_category_overrides')
          .insert(insertions);
      }

      // 5. Salvar reordenações de biomarcadores
      if (pendingChanges.biomarkerReorders.size > 0) {
        const allUpdates = [];
        for (const [category, biomarkers] of pendingChanges.biomarkerReorders) {
          const updates = biomarkers.map((biomarker, index) => ({
            biomarker_name: biomarker.name,
            category: category,
            display_order: index,
          }));
          allUpdates.push(...updates);
        }
        
        if (allUpdates.length > 0) {
          await supabase
            .from('biomarker_category_overrides')
            .upsert(allUpdates, { onConflict: 'biomarker_name' });
        }
      }

      // 6. Salvar ordem das categorias
      if (pendingChanges.categoryOrder) {
        const updates = pendingChanges.categoryOrder.map((category, index) => ({
          category_key: category.name,
          display_order: index,
        }));

        await supabase
          .from('category_display_order')
          .upsert(updates, { onConflict: 'category_key' });
      }

      // Limpar cache e recarregar
      clearCategorizationCache();
      await loadCategories();
      
      // Resetar alterações pendentes
      setPendingChanges({
        categoryOrder: null,
        biomarkerReorders: new Map(),
        biomarkerRenames: new Map(),
        biomarkerAdditions: [],
        biomarkerDeletions: new Set(),
        biomarkerMoves: new Map(),
      });
      setHasUnsavedChanges(false);
      
      toast.success('Todas as alterações foram salvas com sucesso!');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Erro ao salvar alterações');
    }
  };

  const discardChanges = async () => {
    setPendingChanges({
      categoryOrder: null,
      biomarkerReorders: new Map(),
      biomarkerRenames: new Map(),
      biomarkerAdditions: [],
      biomarkerDeletions: new Set(),
      biomarkerMoves: new Map(),
    });
    setHasUnsavedChanges(false);
    await loadCategories();
    toast.info('Alterações descartadas');
  };

  const getStats = () => {
    const totalBiomarkers = categories.reduce((sum, cat) => sum + cat.biomarkers.length, 0);
    const totalOverrides = Array.from(overrides.values()).length;
    const coverage = totalBiomarkers > 0 ? Math.round((totalOverrides / totalBiomarkers) * 100) : 0;

    return {
      totalCategories: categories.length,
      totalBiomarkers,
      totalOverrides,
      coverage
    };
  };

  return {
    categories,
    isLoading,
    updateBiomarkerName,
    moveBiomarker,
    reorderBiomarkers,
    reorderCategories,
    addBiomarker,
    removeBiomarker,
    getStats,
    refresh: loadCategories,
    hasUnsavedChanges,
    saveAllChanges,
    discardChanges
  };
}
