"""
QA chain service for handling question-answering operations.
"""
from typing import Dict, Any, List, Optional
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import Document


class QAChainService:
    """Service for creating and managing QA chains."""
    
    def __init__(self, model_name: str = "gpt-3.5-turbo", temperature: float = 0.0):
        self.llm = ChatOpenAI(model=model_name, temperature=temperature)
        self.prompt_template = PromptTemplate(
            template="""Use the following pieces of context to answer the question at the end. 
            If you don't know the answer based on the context provided, just say that you don't know, 
            don't try to make up an answer.

            Context:
            {context}

            Question: {question}
            
            Answer: Please provide a helpful and accurate answer based on the context provided above. 
            If you reference specific information, mention that it comes from the course materials.""",
            input_variables=["context", "question"]
        )
        
        # Enhanced prompt template for handling attachments
        self.attachment_prompt_template = PromptTemplate(
            template="""You are an AI teaching assistant. Use the following pieces of context to answer the question. 
            The user has provided both course materials and an uploaded file attachment. 
            
            If the question is specifically about the uploaded file, prioritize information from the file content.
            If the question relates to both the course materials and the uploaded file, provide a comprehensive answer using both sources.
            If you don't know the answer based on the provided context, just say that you don't know.

            Course Materials Context:
            {context}

            User's Question and Attachment Context:
            {question}
            
            Answer: Please provide a helpful and accurate answer based on the context provided above. 
            When referencing information, clearly indicate whether it comes from the course materials or the uploaded file.""",
            input_variables=["context", "question"]
        )
    
    def create_qa_chain(self, retriever):
        """
        Create QA chain with retriever.
        
        Args:
            retriever: Document retriever for the topic
            
        Returns:
            Configured QA chain
        """
        try:
            return RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=retriever,
                return_source_documents=True,
                chain_type_kwargs={"prompt": self.prompt_template}
            )
        except Exception as e:
            raise Exception(f"Failed to create QA chain: {str(e)}")
    
    def ask_question(self, qa_chain, question: str) -> Dict[str, Any]:
        """
        Ask question and return answer with sources.
        
        Args:
            qa_chain: Configured QA chain
            question: User's question
            
        Returns:
            Dictionary containing answer and sources
        """
        try:
            # Run the QA chain
            result = qa_chain({"query": question})
            
            # Extract source information
            sources = []
            if "source_documents" in result:
                sources = self._extract_sources(result["source_documents"])
            
            return {
                "answer": result.get("result", "I'm sorry, I couldn't generate an answer."),
                "sources": sources,
                "question": question
            }
            
        except Exception as e:
            raise Exception(f"Failed to generate answer: {str(e)}")
    
    def _extract_sources(self, source_documents: List[Document]) -> List[str]:
        """
        Extract source information from documents.
        
        Args:
            source_documents: List of source documents
            
        Returns:
            List of source references
        """
        sources = []
        
        for i, doc in enumerate(source_documents):
            # Extract page number if available
            page_info = ""
            if hasattr(doc, 'metadata') and doc.metadata:
                page = doc.metadata.get('page')
                source = doc.metadata.get('source', '')
                
                if page is not None:
                    page_info = f" (Page {page + 1})"
                elif source:
                    # Extract filename from path
                    import os
                    filename = os.path.basename(source)
                    page_info = f" (Source: {filename})"
            
            # Create source reference
            source_text = doc.page_content[:100] + "..." if len(doc.page_content) > 100 else doc.page_content
            source_ref = f"Reference {i + 1}{page_info}: {source_text}"
            sources.append(source_ref)
        
        return sources
    
    def validate_question(self, question: str) -> bool:
        """
        Validate if a question is appropriate for processing.
        
        Args:
            question: User's question
            
        Returns:
            True if question is valid, False otherwise
        """
        if not question or not question.strip():
            return False
        
        # Check minimum length
        if len(question.strip()) < 3:
            return False
        
        # Check maximum length (to prevent abuse)
        if len(question) > 1000:
            return False
        
        return True
    
    def create_custom_qa_chain(self, retriever, custom_prompt: str = None):
        """
        Create QA chain with custom prompt.
        
        Args:
            retriever: Document retriever for the topic
            custom_prompt: Custom prompt template
            
        Returns:
            Configured QA chain with custom prompt
        """
        try:
            if custom_prompt:
                prompt = PromptTemplate(
                    template=custom_prompt,
                    input_variables=["context", "question"]
                )
            else:
                prompt = self.prompt_template
            
            return RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=retriever,
                return_source_documents=True,
                chain_type_kwargs={"prompt": prompt}
            )
            
        except Exception as e:
            raise Exception(f"Failed to create custom QA chain: {str(e)}")
    
    def get_conversation_context(self, previous_messages: List[Dict[str, str]], 
                               current_question: str) -> str:
        """
        Build conversation context from previous messages.
        
        Args:
            previous_messages: List of previous messages in the conversation
            current_question: Current question being asked
            
        Returns:
            Formatted conversation context
        """
        if not previous_messages:
            return current_question
        
        context_parts = []
        
        # Add recent conversation history (last 3 exchanges)
        recent_messages = previous_messages[-6:] if len(previous_messages) > 6 else previous_messages
        
        for msg in recent_messages:
            if msg.get("sender") == "user":
                context_parts.append(f"Previous question: {msg.get('message', '')}")
            elif msg.get("sender") == "assistant":
                context_parts.append(f"Previous answer: {msg.get('message', '')}")
        
        context_parts.append(f"Current question: {current_question}")
        
        return "\n".join(context_parts)
    
    def create_qa_chain_with_attachment(self, retriever, attachment_context: bool = False):
        """
        Create QA chain with attachment-aware prompt.
        
        Args:
            retriever: Document retriever for the topic
            attachment_context: Whether to use attachment-aware prompt
            
        Returns:
            Configured QA chain
        """
        try:
            prompt = self.attachment_prompt_template if attachment_context else self.prompt_template
            
            return RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=retriever,
                return_source_documents=True,
                chain_type_kwargs={"prompt": prompt}
            )
        except Exception as e:
            raise Exception(f"Failed to create QA chain: {str(e)}")
    
    def ask_question_with_attachment(self, qa_chain, question: str, attachment_content: Optional[str] = None) -> Dict[str, Any]:
        """
        Ask question with optional attachment context.
        
        Args:
            qa_chain: Configured QA chain
            question: User's question
            attachment_content: Enhanced question with attachment context
            
        Returns:
            Dictionary containing answer and sources
        """
        try:
            # Use attachment-enhanced question if provided, otherwise use original question
            enhanced_question = attachment_content if attachment_content else question
            
            # Run the QA chain
            result = qa_chain({"query": enhanced_question})
            
            # Extract source information
            sources = []
            if "source_documents" in result:
                sources = self._extract_sources(result["source_documents"])
            
            return {
                "answer": result.get("result", "I'm sorry, I couldn't generate an answer."),
                "sources": sources,
                "question": question,  # Return original question
                "has_attachment": attachment_content is not None
            }
            
        except Exception as e:
            raise Exception(f"Failed to generate answer: {str(e)}")
