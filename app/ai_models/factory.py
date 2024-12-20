from typing import Optional, Dict
from .base import AIModel
from .deepseek_model import DeepSeekModel
from .openrouter_model import OpenRouterModel

class AIModelFactory:
    _models: Dict[str, type] = {
        "deepseek": DeepSeekModel,
        "openrouter": OpenRouterModel,
        # Add more models here as they become available
        # "anthropic": AnthropicModel,
    }

    @classmethod
    def create_model(cls, model_name: str, api_key: Optional[str] = None, model_options: Optional[Dict] = None) -> AIModel:
        """
        Create an instance of the specified AI model.
        
        Args:
            model_name: Name of the model to create
            api_key: Optional API key for the model
            model_options: Optional additional configuration for the model
            
        Returns:
            AIModel: An instance of the specified model
            
        Raises:
            ValueError: If the specified model is not supported
        """
        model_class = cls._models.get(model_name.lower())
        if not model_class:
            raise ValueError(f"Unsupported model: {model_name}. Available models: {list(cls._models.keys())}")
        
        if model_options:
            return model_class(api_key=api_key, **model_options)
        return model_class(api_key=api_key)

    @classmethod
    def register_model(cls, name: str, model_class: type) -> None:
        """
        Register a new model type.
        
        Args:
            name: Name of the model
            model_class: The model class to register
        """
        cls._models[name.lower()] = model_class

    @classmethod
    def available_models(cls) -> list:
        """Get a list of available model names."""
        return list(cls._models.keys())
