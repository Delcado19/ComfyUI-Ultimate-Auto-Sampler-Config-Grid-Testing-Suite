import json

import config_builder_node


UltimateConfigBuilder = config_builder_node.UltimateConfigBuilder


def test_matrix_generated_config_survives_builder_transform():
    target = "Z-Image Turbo/latex-zit-smoke-01.safetensors"
    seed = "127749309465779"
    state = {
        "session_name": "matrix_contract",
        "include_none": False,
        "global_positive_groups": [],
        "global_negative": "",
        "config_arrays": [
            {
                "name": "Matrix 1",
                "samplers": ["euler"],
                "schedulers": ["simple"],
                "steps": "10",
                "cfg": "1.0",
                "models": ["None"],
                "loras": [f"{target}:[1.2, 1.3, 1.4, 1.5, 1.6]"],
                "lora_omit_triggers": [],
                "lora_triggerwords_append_settings": {},
                "lora_bypass_states": {},
                "lora_strength_lock": {},
                "model_bypass_states": {},
                "vae_bypass_states": {},
                "te_bypass_states": {},
                "combine": True,
                "positive_prompt_groups": [],
                "negative_prompt": "",
                "use_custom_prompts": False,
                "full_run_seed_behavior": "fixed",
                "full_run_seed": seed,
            }
        ],
    }

    transformed = json.loads(UltimateConfigBuilder.state_to_configs_json(state))
    config = transformed["configs"][0]

    assert config["sampler"] == "euler"
    assert config["scheduler"] == "simple"
    assert config["steps"] == 10
    assert config["cfg"] == 1.0
    assert config["full_run_seed"] == int(seed)
    assert config["full_run_seed_behavior"] == "fixed"
    assert config["lora"] == f"{target}:[1.2, 1.3, 1.4, 1.5, 1.6]"
