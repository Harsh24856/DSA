from langchain.agents import create_agent
from langchain.agents.middleware import ModelCallLimitMiddleware
from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage
from langchain_core.tools import tool
from langgraph.checkpoint.memory import InMemorySaver

@tool
def get_weather(city: str) -> str:
    """Current weather for a city."""
    return f"{city}: 14°C, 70% chance of rain"

class ScriptedModel(GenericFakeChatModel):
    """Plays back fixed replies, so the agent loop runs without an API key."""
    def bind_tools(self, tools, **kwargs):
        return self

model = ScriptedModel(messages=iter([
    AIMessage(content="", tool_calls=[{"name": "get_weather", "args": {"city": "Paris"}, "id": "call_1"}]),
    AIMessage(content="Take an umbrella: 70% chance of rain in Paris."),
]))
# Real use: model="anthropic:claude-sonnet-5-5" (or a ChatAnthropic instance) and real tools.

agent = create_agent(
    model,
    tools=[get_weather],
    system_prompt="You are a concise travel assistant.",
    middleware=[ModelCallLimitMiddleware(run_limit=5)],    # stop runaway loops
    checkpointer=InMemorySaver(),                          # memory per thread_id
)
cfg = {"configurable": {"thread_id": "trip-1"}}
result = agent.invoke({"messages": [{"role": "user", "content": "Umbrella in Paris today?"}]}, cfg)
for m in result["messages"]:
    print(type(m).__name__, "|", m.content or m.tool_calls)
