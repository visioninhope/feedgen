import { VertexHelper } from './vertex';

type PromptPrefix = string;

type PromptContext = {
  data: object | string;
};

type PromptTemplate = {
  prefix: PromptPrefix;
  examples: Example[];
};

type Prompt = PromptTemplate & {
  context: PromptContext;
};

const serializeContext: (context: PromptContext) => string = context => {
  return typeof context.data === 'string'
    ? context.data
    : JSON.stringify(context.data);
};

type Example = {
  input: PromptContext;
  expectedOutput: PromptOutput;
};

type PromptOutput = StringOutput | KeyValueOutput | ArrayOutput;

type StringOutput = string;
type KeyValueOutput = { [key: string]: StringOutput };
type ArrayOutput = Array<PromptOutput>;

export type PromptWorkspace = {
  context: PromptContext;
  lastOutput: PromptOutput;
};

type PostProcessor = (output: PromptOutput) => PromptOutput;

export type PromptGenerator = {
  generate: (workspace: PromptWorkspace) => PromptWorkspace;
};

type PreProcessor = (prompt: Prompt) => string;

const toStringPostProcessor = (output: PromptOutput) => {
  if ( (output as KeyValueOutput).type) {
    
  }

const promptInput = (prompt: Prompt): string => {
  return (
    '' +
    prompt.prefix +
    '\n' +
    prompt.examples
      .map(
        example =>
          serializeContext(example.input) + ' : ' + example.expectedOutput
      )
      .join('\n') +
    '\n' +
    'Context: ' +
    prompt.context
  );
};

export class SingleGenerator implements PromptGenerator {
  vertex: VertexHelper;
  template: PromptTemplate;
  prePocessor: PreProcessor;
  postProcessor: PostProcessor;

  constructor(
    vertex: VertexHelper,
    prompt: PromptTemplate,
    preProcessor: PreProcessor = promptInput,
    postProcessor: PostProcessor = toStringPostProcessor
  ) {
    this.vertex = vertex;
    this.template = prompt;
    this.prePocessor = preProcessor;
    this.postProcessor = postProcessor;
  }
  generate(workspace: PromptWorkspace): PromptWorkspace {
    const fullPrompt = { ...this.template, ...{ context: workspace.context } };
    const input = this.prePocessor(fullPrompt);
    console.log(input);
    const output = this.vertex.predict(input);
    workspace.lastOutput = this.postProcessor(output);
    return workspace;
  }
}

export class GeneratorChain implements PromptGenerator {
  generators: PromptGenerator[];

  constructor(generators: PromptGenerator[]) {
    this.generators = generators;
  }

  generate(workspace: PromptWorkspace): PromptWorkspace {
    for (const generator of this.generators) {
      workspace = generator.generate(workspace);
      workspace.context.data = workspace.lastOutput;
    }
    return workspace;
  }
}
