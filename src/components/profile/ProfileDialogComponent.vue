<template>
	<v-dialog
		:model-value="dialog"
		@update:model-value="hideDialog()"
		max-width="560">
		<v-card class="profile-dialog">
			<div class="profile-dialog__header">
				<span class="profile-dialog__icon">
					<v-icon size="20" icon="mdi-account-edit-outline" />
				</span>
				<span class="profile-dialog__title">Редактирование профиля</span>
			</div>

			<div class="profile-dialog__body">
				<v-text-field
					label="Имя"
					v-model="profile.firstName"
					variant="outlined"
					density="comfortable"
					hide-details="auto"></v-text-field>
				<v-text-field
					label="Фамилия"
					v-model="profile.lastName"
					variant="outlined"
					density="comfortable"
					hide-details="auto"></v-text-field>
				<v-text-field
					label="Отчество"
					v-model="profile.patronymic"
					variant="outlined"
					density="comfortable"
					hide-details="auto"></v-text-field>
				<v-select
					label="Роль"
					:items="roleItems"
					v-model="profile.profileRole"
					variant="outlined"
					density="comfortable"
					hide-details="auto"></v-select>
			</div>

			<v-divider />

			<div class="profile-dialog__actions">
				<v-btn
					color="#1976d2"
					variant="flat"
					prepend-icon="mdi-check"
					@click="updateProfile">Принять</v-btn>
				<v-spacer />
				<v-btn
					color="#5c6470"
					variant="text"
					@click="hideDialog">Закрыть</v-btn>
			</div>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { UPDATE_PROFILE } from '@/api/Mutations'
import { defineComponent, toRefs } from 'vue'
import { useMutation } from '@vue/apollo-composable'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '@/store/profile'

const ROLE_ITEMS = [
	{ title: 'Пользователь', value: 'USER' },
	{ title: 'Автор', value: 'AUTHOR' },
	{ title: 'Администратор', value: 'ADMIN' },
]

export default defineComponent({
	props: {
		dialog: Boolean,
		profile: Object
	},
	emits: ['hideDialog'],
	data() {
		return {
			roleItems: ROLE_ITEMS,
		}
	},
	setup(props: any) {
		const { dialog, profile } = toRefs(props)
    const { currentUser, userList } = storeToRefs(useProfileStore())
		return { 
      dialog,
      profile,
      currentUser,
      userList
     }
	},
	methods: {
		updateProfile() {
			const { mutate, onDone, onError } = useMutation(UPDATE_PROFILE)
			const request = {
				profile: this.profile
			}
			mutate(request)

			onDone(response => {
				const profile = response.data.updateProfile
				this.$emit("hideDialog", false)
				this.currentUser = profile
				const index = this.userList.findIndex(x => x.id == profile.id);
				this.userList[index] = profile
			})

			onError(({graphQLErrors}) => {
				this.$emit("hideDialog", false)
				if (graphQLErrors) {
				graphQLErrors.map(({message}) => {
					console.error(message)
				})
				} 
			})
		},
		hideDialog() {
			this.$emit("hideDialog", false)
		}
	}
})
</script>

<style scoped>
.profile-dialog {
	border-radius: 14px !important;
	border: 1px solid #d6e5f5;
	overflow: hidden;
}

.profile-dialog__header {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 14px 16px;
	background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%);
}

.profile-dialog__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 10px;
	color: #ffffff;
	background: rgba(255, 255, 255, 0.18);
	flex-shrink: 0;
}

.profile-dialog__title {
	font-size: 16px;
	font-weight: 700;
	color: #ffffff;
}

.profile-dialog__body {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 16px;
}

.profile-dialog__actions {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 12px 16px;
}
</style>
