import { runLearningWorkflow } from "@/lib/ai/runtime/learning-workflow";
import { learningRequestSchema } from "@/lib/learning/contracts";

const invalidRequestResponse = () =>
  Response.json({ error: "Invalid request body." }, { status: 400 });

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidRequestResponse();
  }

  const requestResult = learningRequestSchema.safeParse(body);

  if (!requestResult.success) {
    return invalidRequestResponse();
  }

  try {
    const response = await runLearningWorkflow(requestResult.data.message);

    return Response.json(response);
  } catch {
    return Response.json(
      { error: "Unable to process the learning request." },
      { status: 500 },
    );
  }
}
