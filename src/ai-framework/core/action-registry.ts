import type { Tool } from "ai";
import type {
	ActionCategory,
	ActionDefinition,
	ActionRegistry as IActionRegistry,
} from "./types.js";

/**
 * Central registry for AI actions/tools
 * Manages registration, discovery, and organization of available actions
 */
export class ActionRegistry implements IActionRegistry {
	private actions = new Map<string, ActionDefinition>();
	private categorizedActions = new Map<ActionCategory, Set<string>>();

	constructor() {
		// Initialize category maps
		const categories: ActionCategory[] = [
			"playlist",
			"track",
			"user",
			"search",
			"system",
		];
		for (const category of categories) {
			this.categorizedActions.set(category, new Set());
		}
	}

	/**
	 * Register a new action in the registry
	 */
	register(action: ActionDefinition): void {
		// Validate action name uniqueness
		if (this.actions.has(action.name)) {
			throw new Error(`Action '${action.name}' is already registered`);
		}

		// Validate category
		if (!this.categorizedActions.has(action.category)) {
			throw new Error(`Invalid category '${action.category}'`);
		}

		// Register action
		this.actions.set(action.name, action);

		const categorySet = this.categorizedActions.get(action.category);

		if (categorySet) {
			categorySet.add(action.name);
		}
	}

	/**
	 * Unregister an action from the registry
	 */
	unregister(name: string): void {
		const action = this.actions.get(name);

		if (!action) {
			return; // Action doesn't exist, nothing to do
		}

		// Remove from main registry
		this.actions.delete(name);

		// Remove from category index
		this.categorizedActions.get(action.category)?.delete(name);
	}

	/**
	 * Get a specific action by name
	 */
	get(name: string): ActionDefinition | undefined {
		return this.actions.get(name);
	}

	/**
	 * Get all actions in a specific category
	 */
	getByCategory(category: ActionCategory): ActionDefinition[] {
		const actionNames = this.categorizedActions.get(category);
		if (!actionNames) {
			return [];
		}

		return Array.from(actionNames)
			.map((name) => this.actions.get(name))
			.filter((action): action is ActionDefinition => action !== undefined);
	}

	/**
	 * Get all registered actions
	 */
	getAll(): ActionDefinition[] {
		return Array.from(this.actions.values());
	}

	/**
	 * Get all tools in AI SDK format for use with generateText/streamText
	 */
	getTools(): Record<string, Tool> {
		const tools: Record<string, Tool> = {};

		for (const [name, action] of this.actions) {
			tools[name] = action.tool;
		}

		return tools;
	}

	/**
	 * Get tools filtered by category
	 */
	getToolsByCategory(category: ActionCategory): Record<string, Tool> {
		const tools: Record<string, Tool> = {};
		const actions = this.getByCategory(category);

		for (const action of actions) {
			tools[action.name] = action.tool;
		}

		return tools;
	}

	/**
	 * Get tools filtered by permissions
	 */
	getToolsWithPermissions(requiredPermissions: string[]): Record<string, Tool> {
		const tools: Record<string, Tool> = {};

		for (const [name, action] of this.actions) {
			// If action has no permissions requirement, include it
			if (!action.permissions || action.permissions.length === 0) {
				tools[name] = action.tool;
				continue;
			}

			// Check if user has all required permissions
			const hasAllPermissions = action.permissions.every((permission) =>
				requiredPermissions.includes(permission),
			);

			if (hasAllPermissions) {
				tools[name] = action.tool;
			}
		}

		return tools;
	}

	/**
	 * Get registry statistics
	 */
	getStats(): {
		totalActions: number;
		actionsByCategory: Record<ActionCategory, number>;
		actionsWithPermissions: number;
		actionsWithRateLimit: number;
	} {
		const stats = {
			totalActions: this.actions.size,
			actionsByCategory: {} as Record<ActionCategory, number>,
			actionsWithPermissions: 0,
			actionsWithRateLimit: 0,
		};

		// Count by category
		for (const [category, actionNames] of this.categorizedActions) {
			stats.actionsByCategory[category] = actionNames.size;
		}

		// Count actions with special features
		for (const action of this.actions.values()) {
			if (action.permissions && action.permissions.length > 0) {
				stats.actionsWithPermissions++;
			}
			if (action.rateLimit) {
				stats.actionsWithRateLimit++;
			}
		}

		return stats;
	}

	/**
	 * Clear all registered actions (useful for testing)
	 */
	clear(): void {
		this.actions.clear();
		for (const actionSet of this.categorizedActions.values()) {
			actionSet.clear();
		}
	}
}

// Export singleton instance
export const actionRegistry = new ActionRegistry();
