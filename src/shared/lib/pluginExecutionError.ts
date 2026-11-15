const PLUGIN_EXECUTION_MARKER = "произошла ошибка при выполнении плагина";

export interface PluginExecutionError {
    reason: string;
    fullMessage: string;
}

function toGraphQLErrorMessages(error: unknown): string[] {
    const graphQLErrors = (
        error as { graphQLErrors?: unknown } | null | undefined
    )?.graphQLErrors;
    if (Array.isArray(graphQLErrors) && graphQLErrors.length > 0) {
        return graphQLErrors.map((graphQLError) =>
            String(
                (graphQLError as { message?: unknown })?.message ?? graphQLError,
            ),
        );
    }
    if (error instanceof Error && error.message) {
        return [error.message];
    }
    return [];
}

export function extractPluginExecutionError(
    error: unknown,
): PluginExecutionError | null {
    for (const message of toGraphQLErrorMessages(error)) {
        const markerIndex = message
            .toLowerCase()
            .indexOf(PLUGIN_EXECUTION_MARKER);
        if (markerIndex === -1) {
            continue;
        }
        const reason = message
            .slice(markerIndex + PLUGIN_EXECUTION_MARKER.length)
            .replace(/^[\s:]+/, "")
            .trim();
        return {
            reason: reason || message.trim(),
            fullMessage: message,
        };
    }
    return null;
}
