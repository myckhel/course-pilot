"""
Question answering chain module.
Builds a retrieval-based Q&A chain using LangChain and OpenAI.
"""
from langchain.chains import RetrievalQA
from langchain_community.chat_models import ChatOpenAI


def build_qa_chain(retriever):
    """
    Build a RetrievalQA chain with OpenAI LLM and the provided retriever.
    
    Args:
        retriever: A retriever object that can fetch relevant documents.
        
    Returns:
        RetrievalQA: A question-answering chain that uses the provided retriever.
    """
    # Initialize the language model with OpenAI's GPT-3.5-turbo
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    
    # Create a retrieval QA chain
    return RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        chain_type="stuff",
        return_source_documents=False
    )