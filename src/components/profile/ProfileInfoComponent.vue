<template>
  <div v-if="loading" class="lv-loading">
    <v-progress-circular indeterminate size="20" width="2" class="mr-2" />
    Загрузка...
  </div>

  <div v-else-if="profile" class="lv-page">
    <div class="task-hero">
      <v-avatar size="44" :color="avatarColor" class="text-uppercase text-caption font-weight-bold profile-card__hero-avatar">
        {{ initials }}
      </v-avatar>
      <div class="task-hero__text">
        <div class="task-hero__label">Профиль</div>
        <div class="task-hero__name">{{ fullName }}</div>
      </div>
    </div>

    <div class="task-panel task-panel--white">
      <div class="lv-card__row profile-card__row">
        <v-icon size="16" icon="mdi-email-outline" />
        <span class="lv-card__row-text">{{ profile.email }}</span>
      </div>
      <div class="lv-card__row profile-card__row">
        <v-icon size="16" icon="mdi-account-outline" />
        <span class="lv-card__row-text">Имя: {{ profile.firstName || "—" }}</span>
      </div>
      <div class="lv-card__row profile-card__row">
        <v-icon size="16" icon="mdi-account-outline" />
        <span class="lv-card__row-text">Фамилия: {{ profile.lastName || "—" }}</span>
      </div>
      <div class="lv-card__row profile-card__row">
        <v-icon size="16" icon="mdi-account-outline" />
        <span class="lv-card__row-text">Отчество: {{ profile.patronymic || "—" }}</span>
      </div>
      <div class="lv-card__chips profile-card__chips">
        <v-chip size="small" variant="tonal" :color="roleColor">{{ roleLabel }}</v-chip>
      </div>
    </div>

    <v-btn
        v-if="isUserAdmin"
        block
        color="#1976d2"
        variant="flat"
        prepend-icon="mdi-pencil"
        @click="updateProfileClick"
    >Редактировать</v-btn>
  </div>

  <profile-dialog-component
      v-if="dialog"
      :dialog="dialog"
      :profile="profileModel"
      @hideDialog="dialog = false"
  ></profile-dialog-component>
</template>

<script lang="ts">
import {computed, defineComponent, onMounted, ref} from 'vue'
import ProfileDialogComponent from "@/components/profile/ProfileDialogComponent.vue"
import {useProfileStore} from "@/store/profile";
import {UserStorageGetters} from "@/entities/user/storage/getters";
import {getUserFromToken} from "@/entities/user/lib/getUserFromToken";
import { Profile } from "@/__generated__/graphql";

const ROLE_LABELS: Record<string, string> = {
  USER: "Пользователь",
  AUTHOR: "Автор",
  ADMIN: "Администратор",
};

const AVATAR_COLORS = ["#1976d2", "#26a69a", "#ef6c00", "#8e24aa", "#43a047", "#f06292", "#6d4c41", "#1e88e5"];

export default defineComponent({
  components: { ProfileDialogComponent },
  props: {
    profile: {
      type: Object as () => Profile,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const dialog = ref(false)
    const profileModel = ref({ ...props.profile })
    const profileStore = useProfileStore();

    const fullName = computed(() => {
      if (!props.profile) return "";
      return [props.profile.lastName, props.profile.firstName, props.profile.patronymic]
          .filter((part) => part && part.length > 0)
          .join(" ") || props.profile.email;
    });

    const initials = computed(() => {
      const lastName = props.profile?.lastName?.trim();
      const firstName = props.profile?.firstName?.trim();
      const result = `${lastName?.[0] ?? ""}${firstName?.[0] ?? ""}`;
      return result ? result.toUpperCase() : "?";
    });

    const avatarColor = computed(() => {
      const source = props.profile?.email || props.profile?.lastName || "profile";
      const hash = [...source].reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return AVATAR_COLORS[hash % AVATAR_COLORS.length];
    });

    const roleLabel = computed(() => {
      const role = props.profile?.profileRole ?? "";
      return ROLE_LABELS[role] ?? role ?? "—";
    });

    const roleColor = computed(() => {
      const role = props.profile?.profileRole ?? "";
      return role === "ADMIN" ? "blue" : role === "AUTHOR" ? "teal" : "grey";
    });

    onMounted(async () => {
      if (!profileStore.activeUser) {
        const token = await UserStorageGetters.getToken();
        if (token) {
          profileStore.activeUser = await getUserFromToken(token);
        }
      }
    });

    const isUserAdmin = computed(() => {
      return profileStore.activeUser?.role === "ADMIN"
    })

    const updateProfileClick = () => {
      dialog.value = true
      profileModel.value = { ...props.profile }
    }

    return {
      fullName,
      initials,
      avatarColor,
      roleLabel,
      roleColor,
      dialog,
      profileModel,
      updateProfileClick,
      isUserAdmin
    }
  }
})
</script>

<style>
@import "@/components/task/taskViewStyles.css";
@import "@/components/common/listViewStyles.css";
</style>

<style scoped>
.profile-card__hero-avatar {
  color: #ffffff;
  flex-shrink: 0;
}

.profile-card__row {
  padding: 6px 2px;
}

.profile-card__chips {
  margin-top: 8px;
}
</style>
