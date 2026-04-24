/*
 * Training Overlay Export to Unsloth Colab
 * Converts local hallucination traces and Swarm error logs into a Python script 
 * ready to be pasted into a free Google Colab (T4 GPU) utilizing Unsloth for ultra-fast fine-tuning.
 */

import fs from 'fs';
import path from 'path';

/**
 * Generates an Unsloth instruction-tuning Python script from engine training overlays.
 * @param {Array} trainingData - Array of objects with {instruction, input, output}
 * @returns {string} The Python script content
 */
export function generateUnslothScript(trainingData) {
  const dataString = JSON.stringify(trainingData, null, 2);

  return `
# FREE AI LOCAL FALLBACK FINE-TUNING PIPELINE
# Run this on a Free Google Colab T4 GPU
# Powered by Unsloth AI

%%capture
!pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
!pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes

from unsloth import FastLanguageModel
import torch
import json
from datasets import Dataset

max_seq_length = 2048
dtype = None
load_in_4bit = True

# We fine-tune the local fallback reasoning model (e.g., Llama 3 8B)
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/llama-3-8b-Instruct-bnb-4bit",
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

model = FastLanguageModel.get_peft_model(
    model,
    r = 16,
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
    use_rslora = False,
    loftq_config = None,
)

# Injected JSON dataset from FREE AI Engine Error Traces
raw_data = json.loads('''
${dataString}
''')

dataset = Dataset.from_list(raw_data)

alpaca_prompt = """Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
{}

### Input:
{}

### Response:
{}"""

def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    inputs       = examples["input"]
    outputs      = examples["output"]
    texts = []
    for instruction, input, output in zip(instructions, inputs, outputs):
        text = alpaca_prompt.format(instruction, input, output) + tokenizer.eos_token
        texts.append(text)
    return { "text" : texts, }

dataset = dataset.map(formatting_prompts_func, batched = True)

from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False,
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60,
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

# Start training
trainer_stats = trainer.train()

# Export for local Ollama usage
model.save_pretrained_gguf("model", tokenizer, quantization_method = "q4_k_m")
print("Export complete. Download the GGUF to your local machine and import into Ollama to upgrade your Free-Tier fallback.")
`;
}

/**
 * Saves the exported Colab script to the out directory.
 * @param {Array} trainingData 
 */
export function exportToDisk(trainingData) {
  const scriptContent = generateUnslothScript(trainingData);
  const outPath = path.join(process.cwd(), 'out', 'training');
  if (!fs.existsSync(outPath)) {
    fs.mkdirSync(outPath, { recursive: true });
  }
  
  const filePath = path.join(outPath, `unsloth_finetune_${Date.now()}.py`);
  fs.writeFileSync(filePath, scriptContent);
  return filePath;
}
