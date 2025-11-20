import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BIOMARKER_DISPLAY_ORDER, CATEGORY_DISPLAY_ORDER } from '@/utils/biomarkerDisplayOrder';
import { clearCategorizationCache } from '@/services/biomarkerCategoryService';
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

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'hematologico': '🩸 Hematológico',
  'metabolico': '💊 Metabólico',
  'hepatico': '🏥 Hepático',
  'renal': '🫘 Renal',
  'ions': '⚡ Íons e Eletrólitos',
  'hormonal': '🧬 Hormonal',
  'vitaminas': '💎 Vitaminas e Minerais',
  'inflamatorios': '🔥 Marcadores Inflamatórios',
  'musculares': '💪 Marcadores Musculares',
  'prostaticos': '🎯 Marcadores Prostáticos',
  'outros': '📋 Outros'
};

export function useCategoryManagement() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overrides, setOverrides] = useState<Map<string, any>>(new Map());

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

      // Mesclar com BIOMARKER_DISPLAY_ORDER
      let categoriesData: CategoryData[] = CATEGORY_DISPLAY_ORDER.map((categoryKey, index) => {
        const biomarkersInCategory = BIOMARKER_DISPLAY_ORDER[categoryKey] || [];
        
        const biomarkers: BiomarkerData[] = biomarkersInCategory.map((biomarkerName, bioIndex) => {
          const override = overridesMap.get(biomarkerName);
          return {
            name: biomarkerName,
            displayOrder: override?.display_order ?? bioIndex,
            hasOverride: !!override,
            overrideId: override?.id
          };
        });

        // Adicionar biomarcadores que têm override para esta categoria mas não estão no BIOMARKER_DISPLAY_ORDER
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
          displayName: CATEGORY_DISPLAY_NAMES[categoryKey] || categoryKey,
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

  const updateBiomarkerName = async (oldName: string, newName: string, category: string) => {
    try {
      const override = overrides.get(oldName);
      
      if (override) {
        // Atualizar override existente
        const { error } = await supabase
          .from('biomarker_category_overrides')
          .update({ biomarker_name: newName })
          .eq('id', override.id);
        
        if (error) throw error;
      } else {
        // Criar novo override
        const { error } = await supabase
          .from('biomarker_category_overrides')
          .insert({
            biomarker_name: newName,
            category: category,
            display_order: 999
          });
        
        if (error) throw error;
      }

      clearCategorizationCache();
      await loadCategories();
      toast.success(`Biomarcador renomeado para "${newName}"`);
    } catch (error) {
      console.error('Error updating biomarker:', error);
      toast.error('Erro ao renomear biomarcador');
    }
  };

  const moveBiomarker = async (biomarkerName: string, newCategory: string) => {
    try {
      const override = overrides.get(biomarkerName);
      
      if (override) {
        const { error } = await supabase
          .from('biomarker_category_overrides')
          .update({ category: newCategory })
          .eq('id', override.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('biomarker_category_overrides')
          .insert({
            biomarker_name: biomarkerName,
            category: newCategory,
            display_order: 999
          });
        
        if (error) throw error;
      }

      clearCategorizationCache();
      await loadCategories();
      toast.success(`"${biomarkerName}" movido para ${CATEGORY_DISPLAY_NAMES[newCategory]}`);
    } catch (error) {
      console.error('Error moving biomarker:', error);
      toast.error('Erro ao mover biomarcador');
    }
  };

  const reorderBiomarkers = async (category: string, biomarkers: BiomarkerData[]) => {
    try {
      const updates = biomarkers.map((biomarker, index) => ({
        biomarker_name: biomarker.name,
        category: category,
        display_order: index,
        created_by: null // Will be set by DB
      }));

      const { error } = await supabase
        .from('biomarker_category_overrides')
        .upsert(updates, { onConflict: 'biomarker_name' });

      if (error) throw error;

      clearCategorizationCache();
      await loadCategories();
      toast.success('Ordem atualizada com sucesso');
    } catch (error) {
      console.error('Error reordering biomarkers:', error);
      toast.error('Erro ao reordenar biomarcadores');
    }
  };

  const addBiomarker = async (biomarkerName: string, category: string) => {
    try {
      const { error } = await supabase
        .from('biomarker_category_overrides')
        .insert({
          biomarker_name: biomarkerName,
          category: category,
          display_order: 999
        });

      if (error) throw error;

      clearCategorizationCache();
      await loadCategories();
      toast.success(`"${biomarkerName}" adicionado a ${CATEGORY_DISPLAY_NAMES[category]}`);
    } catch (error) {
      console.error('Error adding biomarker:', error);
      toast.error('Erro ao adicionar biomarcador');
    }
  };

  const removeBiomarker = async (biomarkerName: string) => {
    try {
      const { error } = await supabase
        .from('biomarker_category_overrides')
        .delete()
        .eq('biomarker_name', biomarkerName);

      if (error) throw error;

      clearCategorizationCache();
      await loadCategories();
      toast.success(`"${biomarkerName}" removido`);
    } catch (error) {
      console.error('Error removing biomarker:', error);
      toast.error('Erro ao remover biomarcador');
    }
  };

  const reorderCategories = async (reorderedCategories: CategoryData[]) => {
    try {
      const updates = reorderedCategories.map((category, index) => ({
        category_key: category.name,
        display_order: index,
      }));

      const { error } = await supabase
        .from('category_display_order')
        .upsert(updates, { onConflict: 'category_key' });

      if (error) throw error;

      clearCategorizationCache();
      await loadCategories();
      toast.success('Ordem das categorias atualizada');
    } catch (error) {
      console.error('Error reordering categories:', error);
      toast.error('Erro ao reordenar categorias');
    }
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
    refresh: loadCategories
  };
}
