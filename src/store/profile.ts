import { defineStore } from "pinia";
import { Profile } from "@/__generated__/graphql";
import { Role } from "@/common/Role";
import { GET_ALL_PROFILES_QUERY } from "@/api/Queries";
import { useQuery } from "@vue/apollo-composable";

interface UserInfo {
  firstName: string;
  lastName: string;
}

export interface ActiveUserInfo {
  role: string;
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  patronymic?: string;
}

interface FilterState {
  email: string;
  firstName: string;
  lastName: string;
  patronymic: string;
  role: string;
}

export const useProfileStore = defineStore("profile", {
  state: () => {
    return {
      userList: [] as Profile[],
      authors: [] as Profile[],
      activeUser: null as ActiveUserInfo | null,
      currentUser: null as Profile | null,
      filterState: {
        email: "",
        firstName: "",
        lastName: "",
        patronymic: "",
        role: "",
      } as FilterState,
    };
  },
  getters: {
    getFilteredProfiles(state): Profile[] {
      const { email, firstName, lastName, patronymic, role }: FilterState = state.filterState;

      return state.userList.filter((user: Profile): boolean => {
        return (
            (email === "" || user.email === email) &&
            (firstName === "" || user.firstName === firstName) &&
            (lastName === "" || user.lastName === lastName) &&
            (patronymic === "" || user.patronymic === patronymic) &&
            (role === "" || user.profileRole === role)
        );
      });
    },
  },
  actions: {
    // Список авторов для фильтров задач/графов/плагинов: один запрос
    // на бэкенд, дальше живёт в памяти стора.
    async loadAuthors() {
      if (this.authors.length > 0) {
        return;
      }
      const { onResult, onError } = useQuery(GET_ALL_PROFILES_QUERY);
      return new Promise<void>((resolve) => {
        onResult((result) => {
          // При ошибке запроса onResult приходит с data === undefined —
          // не падаем, авторы доберутся из загруженных таблиц.
          this.addAuthors(result.data?.getAllProfiles?.items ?? []);
          resolve();
        });
        onError((error) => {
          console.error("Failed to load authors", error);
          resolve();
        });
      });
    },
    // Дополняет список авторов из author загруженных задач/графов/плагинов —
    // работает даже если getAllProfiles недоступен текущему пользователю.
    addAuthors(authors: (Profile | null | undefined)[]) {
      const known = new Set(this.authors.map((author) => author.id));
      for (const author of authors) {
        if (author?.id && !known.has(author.id)) {
          this.authors.push(author);
          known.add(author.id);
        }
      }
    },
  },
});