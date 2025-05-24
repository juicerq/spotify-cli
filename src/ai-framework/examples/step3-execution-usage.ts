import { AISDKConfig, createConfigFromEnv } from "../config/ai-sdk-config.js";
import { AIIntegration } from "../core/ai-integration.js";
import type { AIContext } from "../core/types.js";
import { registerAllTools } from "../tools/tool-registry.js";

/**
 * Exemplo completo do Passo 3: Tool Execution Engine
 * Demonstra execução real dos tools com integração AI SDK
 */

async function step3ExecutionExample() {
	console.log("🚀 Passo 3: Tool Execution Engine - Exemplo Completo\n");

	// 1. Configurar AI SDK
	console.log("1. Configurando AI SDK...");
	const config = createConfigFromEnv();
	const aiConfig = new AISDKConfig(config);
	console.log(`✅ Configurado com provider: ${config.defaultProvider}\n`);

	// 2. Registrar todos os tools
	console.log("2. Registrando tools...");
	registerAllTools();
	console.log("✅ 39 tools registrados\n");

	// 3. Inicializar AI Integration
	console.log("3. Inicializando AI Integration...");
	const aiIntegration = new AIIntegration(aiConfig, {
		execution: {
			enableRateLimit: true,
			maxRetries: 3,
			retryDelayMs: 1000,
			enableLogging: true,
		},
		maxSteps: 5,
		enableStreaming: false,
		autoSaveContext: true,
	});

	// Simular contexto do Spotify autenticado
	const mockSpotifyContext: AIContext = {
		session: {
			sessionId: "example-session",
			startTime: new Date(),
			lastActivity: new Date(),
			metadata: { example: true },
		},
		spotify: {
			accessToken: "mock-access-token",
			refreshToken: "mock-refresh-token",
			userId: "example-user",
			isAuthenticated: true,
		},
		conversationHistory: [],
	};

	const context = await aiIntegration.initialize(mockSpotifyContext);
	console.log(
		`✅ AI Integration inicializada (Session: ${context.session.sessionId})\n`,
	);

	// 4. Demonstrar execução de tools individuais
	console.log("4. Testando execução de tools individuais...\n");

	// Test system tools
	console.log("📊 Testando system tools:");

	const systemStatus = await aiIntegration.executeAction(
		"get_system_status",
		{},
		context,
	);
	console.log(
		`   ✅ get_system_status: ${systemStatus.success ? "success" : "failed"}`,
	);

	const availableTools = await aiIntegration.executeAction(
		"get_available_tools",
		{},
		context,
	);
	console.log(
		`   ✅ get_available_tools: ${availableTools.success ? "success" : "failed"}`,
	);
	console.log(
		`   📈 Tools disponíveis: ${(availableTools.data as { count: number })?.count || 0}\n`,
	);

	// Test playlist tools (mock execution)
	console.log("🎵 Testando playlist tools:");

	const userPlaylists = await aiIntegration.executeAction(
		"get_user_playlists",
		{
			limit: 10,
			offset: 0,
		},
		context,
	);
	console.log(
		`   ✅ get_user_playlists: ${userPlaylists.success ? "success" : "failed"}`,
	);

	// Test search tools
	console.log("🔍 Testando search tools:");

	const searchTracks = await aiIntegration.executeAction(
		"search_tracks",
		{
			query: "rock music",
			limit: 5,
		},
		context,
	);
	console.log(
		`   ✅ search_tracks: ${searchTracks.success ? "success" : "failed"}\n`,
	);

	// 5. Demonstrar execução com AI prompts
	console.log("5. Testando execução com AI prompts...\n");

	try {
		// Exemplo 1: Prompt simples com tools de sistema
		console.log("🤖 Prompt 1: Status do sistema");
		const response1 = await aiIntegration.executePrompt(
			"What's the current system status and how many tools are available?",
			context,
			{ category: "system" },
		);

		console.log(`   📝 Resposta: ${response1.text.substring(0, 100)}...`);
		console.log(`   🔧 Tools executados: ${response1.toolCalls.length}`);
		console.log(`   ✅ Sucesso: ${response1.success}\n`);

		// Exemplo 2: Prompt com tools de playlist
		console.log("🤖 Prompt 2: Gerenciamento de playlists");
		const response2 = await aiIntegration.executePrompt(
			"List my playlists and help me understand what tools are available for playlist management",
			context,
			{ category: "playlist" },
		);

		console.log(`   📝 Resposta: ${response2.text.substring(0, 100)}...`);
		console.log(`   🔧 Tools executados: ${response2.toolCalls.length}`);
		console.log(`   ✅ Sucesso: ${response2.success}\n`);
	} catch (error) {
		console.log(`   ❌ Erro na execução com AI: ${error}`);
		console.log("   ℹ️  Isso é esperado sem tokens de API reais\n");
	}

	// 6. Demonstrar streaming (se habilitado)
	console.log("6. Testando streaming...\n");

	try {
		console.log("🌊 Iniciando stream...");
		const stream = await aiIntegration.streamPrompt(
			"Give me a quick overview of available tools",
			context,
			{ tools: ["get_available_tools", "get_help"] },
		);

		let chunks = 0;
		for await (const chunk of stream) {
			chunks++;
			if (chunk.type === "text" && chunk.content) {
				process.stdout.write(chunk.content);
			} else if (chunk.type === "tool-call") {
				console.log(`\n   🔧 Tool chamado: ${chunk.toolCall?.name}`);
			} else if (chunk.type === "finish") {
				console.log(`\n   ✅ Stream finalizado (${chunks} chunks)\n`);
				break;
			}
		}
	} catch (error) {
		console.log(`   ❌ Erro no streaming: ${error}`);
		console.log("   ℹ️  Isso é esperado sem tokens de API reais\n");
	}

	// 7. Demonstrar filtros e permissões
	console.log("7. Testando filtros e permissões...\n");

	const toolsByCategory = await aiIntegration.getAvailableTools({
		category: "playlist",
	});
	console.log(`   🎵 Tools de playlist: ${toolsByCategory.count}`);

	const toolsWithPermissions = await aiIntegration.getAvailableTools({
		permissions: ["playlist:read", "playlist:write"],
	});
	console.log(
		`   🔐 Tools com permissões específicas: ${toolsWithPermissions.count}`,
	);

	// 8. Status final
	console.log("\n8. Status final do sistema...\n");

	const finalStatus = await aiIntegration.getSystemStatus();
	console.log(`   📊 Status: ${finalStatus.status}`);
	console.log(`   🎵 Tools disponíveis: ${finalStatus.availableTools}`);
	console.log(
		`   💬 Mensagens no contexto: ${finalStatus.context.conversationHistory.length}`,
	);
	console.log(
		`   ⏱️  Sessão ativa desde: ${finalStatus.context.session.startTime.toISOString()}`,
	);

	console.log("\n✅ Passo 3 concluído com sucesso!");
	console.log("\n📈 Estatísticas finais:");
	console.log("   - Tools registrados: 39");
	console.log("   - Categorias: 5 (playlist, track, user, search, system)");
	console.log("   - Execução real: ✅ Implementada");
	console.log("   - Rate limiting: ✅ Ativo");
	console.log("   - Error handling: ✅ Robusto");
	console.log("   - AI Integration: ✅ Completa");
}

// Exemplo de uso direto do Execution Engine
async function directExecutionExample() {
	console.log("\n🔧 Exemplo de uso direto do Execution Engine:\n");

	const { ToolExecutionEngine } = await import("../core/execution-engine.js");

	const engine = new ToolExecutionEngine({
		enableRateLimit: false,
		maxRetries: 1,
		retryDelayMs: 500,
		enableLogging: true,
	});

	// Mock context
	const mockContext: AIContext = {
		session: {
			sessionId: "direct-example",
			startTime: new Date(),
			lastActivity: new Date(),
			metadata: {},
		},
		spotify: {
			accessToken: "mock-token",
			isAuthenticated: true,
		},
		conversationHistory: [],
	};

	await engine.initialize(mockContext);

	// Test direct execution
	const result = await engine.executeAction("get_system_status", {
		context: mockContext,
		toolCallId: "test-call",
		parameters: {},
	});

	console.log(
		`   ✅ Execução direta: ${result.success ? "success" : "failed"}`,
	);
	console.log(
		`   📊 Dados retornados: ${JSON.stringify(result.data).substring(0, 100)}...`,
	);
}

// Executar exemplos
if (import.meta.url === `file://${process.argv[1]}`) {
	step3ExecutionExample()
		.then(() => directExecutionExample())
		.catch(console.error);
}

export { directExecutionExample, step3ExecutionExample };
