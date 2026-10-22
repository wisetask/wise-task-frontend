import { Maybe } from "@/__generated__/graphql";
import { defineStore } from "pinia";

export interface GraphFilter {
    name: string,
    authorId: string,
    vertexCount: number | null,
    edgeCount: number | null,
    isDirect: string | boolean,
    isNamed: string | boolean,
    isFiltered: boolean,
    appliedAt: number,
}

export const useGraphStore = defineStore('graph', {
    state: () => {
        return {
            graphLibrary: [] as Graph[],
            activeGraph: {
                isDirect: false,
                edges: {},
                nodes: {},
                layouts: { nodes: {} }
            } as Graph,
            graphFilter: {
                name: "",
                authorId: "",
                vertexCount: null,
                edgeCount: null,
                isDirect: "",
                isNamed: "",
                isFiltered: false,
                appliedAt: 0
            } as GraphFilter,
            constructorGraphState: {
                isDirect: false,
                mode: ConstructionMode.DRAW
            } as any
        }
    }
})


export interface Graph {
    id: Maybe<string>,
    name: Maybe<string> | undefined,
    isDirect: boolean,
    edges: any,
    nodes: any,
    layouts: any
}

export enum ConstructionMode {
    MOVE,
    DRAW,
    EDIT,
    DELETE
}
