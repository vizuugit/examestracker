import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="text-xl font-bold mb-6 text-white tracking-tight">Exames</h3>
            <p className="text-white/70 mb-6">
              Plataforma inteligente de gestão de exames médicos com IA. 
              Automatize a análise de laudos e visualize a evolução dos seus pacientes.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white/70 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="mailto:contato@exames.app" className="text-white/70 hover:text-white transition-colors" aria-label="Email">
                <Mail size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6 text-white tracking-tight">Links Rápidos</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-white/70 hover:text-white transition-opacity">Home</Link></li>
              <li><a href="#contact" className="text-white/70 hover:text-white transition-opacity">Contato</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-opacity">Sobre Nós</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-opacity">Funcionalidades</a></li>
              <li><a href="#" className="text-white/70 hover:text-white transition-opacity">Preços</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6 text-white tracking-tight">Legal</h3>
            <ul className="space-y-3">
              <li><a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-opacity">Política de Privacidade</a></li>
              <li><a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-opacity">Termos de Uso</a></li>
              <li><a href="/accessibility" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-opacity">Acessibilidade</a></li>
              <li><a href="/cookie-policy" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-opacity">Política de Cookies</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6 text-white tracking-tight">Newsletter</h3>
            <p className="text-white/70 mb-4">
              Receba novidades e atualizações da plataforma.
            </p>
            <form className="flex flex-col space-y-4">
              <Input
                type="email"
                placeholder="Seu email"
                className="bg-white/5 border-white/10 placeholder:text-white/50 text-white"
              />
              <Button className="bg-rest-blue hover:bg-rest-cyan text-white rounded-full transition-colors">
                Inscrever-se
              </Button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-8 text-center">
          <p className="text-white/70">
            &copy; {new Date().getFullYear()} Exames. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
