export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { automaticLearningRequest, runLearningWorkflow } = await import(
    "./lib/ai/runtime/learning-workflow"
  );

  try {
    await runLearningWorkflow(automaticLearningRequest);
    console.log("[learning] Automatic learning analysis completed.");
  } catch (error) {
    console.error("[learning] Automatic learning analysis failed.", error);
  }
}
