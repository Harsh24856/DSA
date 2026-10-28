from langchain_core.documents import Document
from langchain_core.embeddings import DeterministicFakeEmbedding
from langchain_core.language_models.fake_chat_models import FakeListChatModel
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableParallel, RunnablePassthrough
from langchain_core.vectorstores import InMemoryVectorStore

docs = [Document(page_content=t, metadata={"id": i}) for i, t in enumerate([
    "Refunds are issued within 14 days of a return.",
    "EU customers may cancel any order within 30 days.",
    "Shipping to Canada takes 5 to 8 working days.",
])]
# Fake embeddings and a scripted model, so this runs offline. Swap in real ones:
#   OpenAIEmbeddings / VoyageAIEmbeddings / HuggingFaceEmbeddings, and ChatAnthropic(model=...)
store = InMemoryVectorStore.from_documents(docs, DeterministicFakeEmbedding(size=64))
retriever = store.as_retriever(search_kwargs={"k": 2})
model = FakeListChatModel(responses=["EU customers can cancel within 30 days [1]."])

prompt = ChatPromptTemplate.from_messages([
    ("system", "Answer only from the context and cite ids like [0].\n\nContext:\n{context}"),
    ("human", "{question}"),
])

def format_docs(ds):
    return "\n".join(f"[{d.metadata['id']}] {d.page_content}" for d in ds)

# LCEL: every piece is a Runnable, and | pipes one output into the next input
chain = (
    RunnableParallel(context=retriever | format_docs, question=RunnablePassthrough())
    | prompt
    | model
    | StrOutputParser()
)

print(chain.invoke("Can I cancel an order in the EU?"))
for chunk in chain.stream("Can I cancel an order in the EU?"):   # same chain, streamed piece by piece
    print(chunk, end="|")
print()
