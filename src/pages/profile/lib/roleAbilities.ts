export interface RoleAbility {
  text: string;
  available: boolean;
  whoCan: string;
}

interface Ability {
  text: string;
  roles: string[];
  whoCan: string;
}

const ABILITIES: Ability[] = [
  {
    text: "Решать задачи и сразу видеть, верно ли",
    roles: ["USER", "AUTHOR", "ADMIN"],
    whoCan: "",
  },
  {
    text: "Возвращаться к своим решениям",
    roles: ["USER", "AUTHOR", "ADMIN"],
    whoCan: "",
  },
  {
    text: "Создавать задачи в конструкторе",
    roles: ["AUTHOR", "ADMIN"],
    whoCan: "авторам",
  },
  {
    text: "Управлять плагинами и пользователями",
    roles: ["ADMIN"],
    whoCan: "администраторам",
  },
];

export function roleAbilities(role: string): RoleAbility[] {
  const result: RoleAbility[] = [];
  for (const ability of ABILITIES) {
    result.push({
      text: ability.text,
      available: ability.roles.includes(role),
      whoCan: ability.whoCan,
    });
  }
  return result;
}

export function roleHint(role: string): string {
  if (role === "USER") {
    return "Нужен доступ к конструктору задач — напишите преподавателю.";
  }
  if (role === "AUTHOR") {
    return "Плагинами и пользователями управляют администраторы.";
  }
  return "";
}
