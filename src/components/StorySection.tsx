import { ArrowRight, Award, Users, Globe, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const StorySection = () => {
  return <section className="py-12 md:py-20 lg:py-24 bg-gradient-to-b from-black via-zinc-900 to-black relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/50 to-transparent" />
      
      
    </section>;
};
const stats = [{
  icon: Globe,
  number: "25+",
  label: "Locations"
}, {
  icon: Users,
  number: "10K+",
  label: "Members"
}, {
  icon: Award,
  number: "98%",
  label: "Satisfaction"
}, {
  icon: Star,
  number: "5.0",
  label: "Rating"
}];
export default StorySection;