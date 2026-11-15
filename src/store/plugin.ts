import { Plugin } from "@/__generated__/graphql";
import { defineStore } from "pinia";

export const usePluginStore = defineStore('plugin', {
    state: () => {
        return {
            plugins: [] as Plugin[],
            pluginInput: {
                name: "",
                description: "",
                category: "",
                graphType: "ANY",
                pluginType: "GRAPH_PROPERTY"
            } as PluginInput,
            dialog: false,
            pluginFilter: {
                name: "",
                description: "",
                category: "",
                graphType: "",
                pluginType: "",
                isInternal: false,
                authorId: "",
                isValid: false,
                isFiltered: false,
                appliedAt: 0
            } as PluginFilter,
            persist: true
        }
    },
    getters: {
        getFilteredPlugins(state) {
            const {
                name, description, category, graphType, pluginType,
                isInternal, authorId, isValid, isFiltered
            }: PluginFilter = state.pluginFilter
            return state.plugins.filter((item) => {
                return !isFiltered || (
                    (name === "" || item.name === name) &&
                    (description === "" || item.description === description) &&
                    (category === "" || item.category === category) &&
                    (graphType === "" || item.graphType === graphType) &&
                    (pluginType === "" || item.pluginType === pluginType) &&
                    (authorId === "" || item.author?.id === authorId) &&
                    item.isValid === isValid &&
                    item.isInternal === isInternal
                )
            })
        }
    }
})

interface PluginInput {
    id?: string,
    name: string,
    description: string,
    category: string
    graphType: string,
    pluginType: string,
    jarFile?: any
}

interface PluginFilter {
    name: string,
    description: string,
    category: string,
    graphType: string,
    pluginType: string,
    isInternal: boolean,
    authorId: string,
    isValid: boolean,
    isFiltered: boolean,
    appliedAt: number
}
