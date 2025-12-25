"""
User-friendly error messages for LLM failures.

Provides helpful, actionable error messages instead of technical stack traces.
"""

import logging
from typing import Optional
from utils.model_capabilities import is_small_model

logger = logging.getLogger(__name__)


def get_model_recommendation(model_name: str) -> str:
    """
    Get model recommendations based on model type.

    Args:
        model_name: Name of the model that failed

    Returns:
        Recommendation string
    """
    if is_small_model(model_name):
        return (
            f"\n\n💡 **Using small model ({model_name})**\n"
            f"Small models work best with:\n"
            f"- Shorter presentations (< 10 slides)\n"
            f"- Simple topics\n"
            f"- Clear, focused prompts\n\n"
            f"Consider using a larger model like GPT-4, Claude, or Gemini for:\n"
            f"- Longer presentations\n"
            f"- Complex topics\n"
            f"- More detailed content"
        )
    else:
        return (
            f"\n\n💡 The model {model_name} should handle this request well. "
            f"This might be a temporary API issue."
        )


def format_error_for_user(
    error: Exception,
    operation_type: str,
    model_name: str,
    attempts: int = 1,
    additional_context: Optional[str] = None
) -> str:
    """
    Format an error message in a user-friendly way.

    Args:
        error: The exception that occurred
        operation_type: Type of operation (outline, structure, etc.)
        model_name: Name of the model
        attempts: Number of attempts made
        additional_context: Additional context about what was being done

    Returns:
        User-friendly error message
    """
    error_str = str(error).lower()

    # Determine error category
    if "timeout" in error_str or "timed out" in error_str:
        return format_timeout_error(model_name, operation_type, attempts)

    elif "rate limit" in error_str or "429" in error_str:
        return format_rate_limit_error(model_name, operation_type)

    elif "connection" in error_str or "network" in error_str:
        return format_connection_error(model_name, operation_type)

    elif "json" in error_str or "parse" in error_str or "invalid" in error_str:
        return format_json_error(model_name, operation_type, attempts)

    elif "authentication" in error_str or "api key" in error_str or "401" in error_str:
        return format_auth_error(model_name)

    elif "quota" in error_str or "limit exceeded" in error_str:
        return format_quota_error(model_name)

    else:
        return format_generic_error(error, model_name, operation_type, attempts, additional_context)


def format_timeout_error(model_name: str, operation_type: str, attempts: int) -> str:
    """Format timeout error message."""
    return f"""
⏱️ **Request Timeout**

The {operation_type} generation with {model_name} took too long and timed out after {attempts} attempt(s).

**What you can try:**
- Try again - the model might be busy
- Use a smaller number of slides
- Simplify your topic or instructions
- Check your internet connection
{get_model_recommendation(model_name)}
    """.strip()


def format_rate_limit_error(model_name: str, operation_type: str) -> str:
    """Format rate limit error message."""
    return f"""
🚦 **Rate Limit Reached**

You've made too many requests to {model_name} in a short time.

**What you can do:**
- Wait a few minutes and try again
- Check your API provider's rate limits
- Consider upgrading your API plan for higher limits
- Use a different model temporarily
    """.strip()


def format_connection_error(model_name: str, operation_type: str) -> str:
    """Format connection error message."""
    return f"""
🌐 **Connection Error**

Could not connect to {model_name} for {operation_type} generation.

**What you can check:**
- Your internet connection
- API service status (check provider's status page)
- Firewall or proxy settings
- API endpoint URL configuration

Try again in a moment - this is usually temporary.
    """.strip()


def format_json_error(model_name: str, operation_type: str, attempts: int) -> str:
    """Format JSON parsing error message."""
    if is_small_model(model_name):
        return f"""
🔧 **Output Format Issue**

{model_name} generated output that couldn't be parsed after {attempts} attempt(s).

**This happens with small models because:**
- They struggle with strict formatting requirements
- Complex prompts can confuse them
- They're less reliable with JSON output

**What you can try:**
- Reduce the number of slides
- Simplify your instructions
- Use a larger model (GPT-4, Claude 3.5, Gemini Pro)
- Try again - small models can be inconsistent
        """.strip()
    else:
        return f"""
🔧 **Output Format Issue**

{model_name} generated output in an unexpected format after {attempts} attempt(s).

**What you can try:**
- Try again - this is usually temporary
- Check if the API service is experiencing issues
- Verify your API key is valid and has sufficient credits
        """.strip()


def format_auth_error(model_name: str) -> str:
    """Format authentication error message."""
    return f"""
🔐 **Authentication Error**

Could not authenticate with {model_name}.

**What to check:**
- Your API key is correctly configured
- The API key hasn't expired
- You have sufficient credits/quota
- The API key has necessary permissions

**How to fix:**
1. Go to Settings in the application
2. Verify your API key is correct
3. Check your account balance with the API provider
4. Generate a new API key if needed
    """.strip()


def format_quota_error(model_name: str) -> str:
    """Format quota exceeded error message."""
    return f"""
💳 **Quota Exceeded**

Your account has reached its usage limit for {model_name}.

**What to do:**
- Check your account balance with the API provider
- Upgrade your API plan for higher limits
- Wait for your quota to reset (usually monthly)
- Use a different model with available quota
    """.strip()


def format_generic_error(
    error: Exception,
    model_name: str,
    operation_type: str,
    attempts: int,
    additional_context: Optional[str] = None
) -> str:
    """Format generic error message."""
    error_details = str(error)[:200]  # Truncate long errors

    message = f"""
❌ **Generation Failed**

Failed to generate {operation_type} with {model_name} after {attempts} attempt(s).

**Error details:**
{error_details}
    """

    if additional_context:
        message += f"\n\n**Context:**\n{additional_context}"

    message += get_model_recommendation(model_name)

    message += """

**What to try:**
- Try again - some issues are temporary
- Use a different model
- Simplify your request
- Check the application logs for more details
    """

    return message.strip()


def get_retry_suggestion(attempts: int, max_retries: int, is_small: bool) -> str:
    """
    Get suggestion for retrying.

    Args:
        attempts: Number of attempts so far
        max_retries: Maximum retries configured
        is_small: Whether using small model

    Returns:
        Suggestion string
    """
    if attempts >= max_retries:
        if is_small:
            return (
                f"\n\n💡 **Tried {attempts} times**\n"
                f"Small models can be inconsistent. Consider:\n"
                f"- Using a larger model (GPT-4, Claude, Gemini)\n"
                f"- Simplifying your request\n"
                f"- Reducing the number of slides"
            )
        else:
            return (
                f"\n\n💡 **Tried {attempts} times**\n"
                f"This might be an API issue. Consider:\n"
                f"- Checking the API service status\n"
                f"- Trying again in a few minutes\n"
                f"- Using a different model"
            )
    else:
        remaining = max_retries - attempts
        return (
            f"\n\n🔄 **Retrying** ({remaining} attempt(s) remaining)\n"
            f"The system will automatically retry with adjusted settings..."
        )


def create_progress_message(
    operation_type: str,
    model_name: str,
    attempt: int,
    complexity_level: int,
    is_chunked: bool = False,
    chunk_info: Optional[str] = None
) -> str:
    """
    Create progress message for streaming to user.

    Args:
        operation_type: Type of operation
        model_name: Model being used
        attempt: Current attempt number
        complexity_level: Prompt complexity level
        is_chunked: Whether using chunking
        chunk_info: Information about current chunk

    Returns:
        Progress message string
    """
    is_small = is_small_model(model_name)

    message = f"🎯 Generating {operation_type}"

    if is_small:
        message += f" (small model mode)"

    if attempt > 1:
        message += f" - Attempt {attempt}"

    if complexity_level > 0:
        levels = ["standard", "simplified", "minimal", "basic"]
        level_name = levels[min(complexity_level, len(levels) - 1)]
        message += f" using {level_name} prompt"

    if is_chunked and chunk_info:
        message += f" - {chunk_info}"

    message += "..."

    return message


# Example usage
if __name__ == "__main__":
    # Test different error types
    print("=" * 80)
    print("JSON Error (Small Model)")
    print("=" * 80)
    print(format_json_error("qwen2.5-7b", "outline", 3))

    print("\n" + "=" * 80)
    print("JSON Error (Large Model)")
    print("=" * 80)
    print(format_json_error("gpt-4", "outline", 2))

    print("\n" + "=" * 80)
    print("Timeout Error")
    print("=" * 80)
    print(format_timeout_error("llama-3.2-3b", "structure", 5))

    print("\n" + "=" * 80)
    print("Authentication Error")
    print("=" * 80)
    print(format_auth_error("gpt-4"))

    print("\n" + "=" * 80)
    print("Progress Message")
    print("=" * 80)
    print(create_progress_message(
        "outline",
        "qwen2.5-7b",
        attempt=2,
        complexity_level=1,
        is_chunked=True,
        chunk_info="Processing slides 4-6 of 15"
    ))
