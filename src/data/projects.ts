import projectData from "./projects.json";

export type PortfolioProject = {
  slug: string;
  title: string;
  category: string;
  cover: string;
  wireframe?: string;
  model?: string;
  video?: string;
  gallery?: string[];
  description: string;
  software: string[];
  year: number;
  size: "small" | "large" | "wide";
  specs?: {
    polygons: string;
    vertices: string;
    textures: string;
    materials: string;
    uvMaps: string;
    workflow: string;
    renderer: string;
  };
  translations?: {
    ru?: {
      title: string;
      category: string;
      description: string;
    };
  };
};

export const projects = projectData as PortfolioProject[];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
