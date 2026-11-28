export interface HeaderSection {
  title: string;
  to: string;
}

export interface HeaderUser {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

// Какие разделы показать в шапке. role === null — пользователь не вошёл.
export function visibleSections(role: string | null): HeaderSection[] {
  const sections: HeaderSection[] = [
    { title: "Треки", to: "/tracks" },
    { title: "Задачи", to: "/tasks" },
    { title: "Библиотека графов", to: "/graphs" },
  ];

  if (role === null) {
    return sections;
  }

  sections.push({ title: "Мои решения", to: "/solutions" });

  if (role === "AUTHOR" || role === "ADMIN") {
    sections.push({ title: "Конструктор задач", to: "/constructor" });
  }

  if (role === "ADMIN") {
    sections.push({ title: "Плагины", to: "/plugins" });
    sections.push({ title: "Пользователи", to: "/users" });
  }

  return sections;
}

// Раздел подсвечивается на своей странице и на вложенных: /tasks/15 подсветит «Задачи».
export function isSectionActive(currentPath: string, sectionPath: string): boolean {
  return currentPath === sectionPath || currentPath.startsWith(sectionPath + "/");
}
