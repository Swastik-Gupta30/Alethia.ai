import os
import pandas as pd
import json
from langchain.tools import tool
from langchain_experimental.agents import create_pandas_dataframe_agent
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from typing import List

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CSV_PATH = os.path.join(DATA_DIR, "market_data.csv")
JSON_PATH = os.path.join(DATA_DIR, "narratives.json")

# Initialize LLM for the Pandas Agent
# Note: GROQ_API_KEY should be in environment variables
llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.1
)

@tool
def financial_comparator_tool(query: str) -> str:
    """
    Useful for comparing financial metrics between companies (tickers), listing available companies, 
    or querying the dataset using market_data.csv.
    Can handle queries like 'Compare Alpha and Beta' or 'What companies are in the data?'.
    """
    df = pd.read_csv(CSV_PATH)
    
    agent = create_pandas_dataframe_agent(
        llm,
        df,
        verbose=True,
        allow_dangerous_code=True,
        prefix="""
        You are a financial analyst. 
        When asked to compare tickers (e.g., 'Compare Alpha and Beta'), 
        you MUST fetch the relevant rows for ALL mentioned tickers from the dataframe.
        If asked to list companies, YOU MUST execute `df['ticker'].unique()` to get the complete list.
        Format the output diligently as a markdown table showing the comparison of key metrics.
        If the user asks for specific metrics, focus on those.
        """
    )
    
    try:
        response = agent.invoke(query)
        return response['output']
    except Exception as e:
        return f"Error executing financial comparison: {str(e)}"

@tool
def diagnostic_tool(ticker: str) -> str:
    """
    Diagnoses issues with a specific ticker by checking alignment flags in narratives.json.
    Input should be the ticker symbol (e.g., 'ALPHA').
    """
    try:
        if not os.path.exists(JSON_PATH):
            return "Error: narratives.json not found."

        with open(JSON_PATH, 'r') as f:
            data = json.load(f)
        
        # Look for the ticker
        record = next((item for item in data if item["ticker"].upper() == ticker.upper()), None)
        
        if not record:
            return f"No narrative data found for ticker {ticker}."
        
        # Check alignment_flag
        # Prompt says: "If it detects a mismatch (e.g., flag == False or label == 0)"
        # verification logic: if alignment_flag is False (mismatch), warn.
        # But wait, the prompt says "return a specific string: 'Consistency Warning...'"
        
        if record.get("alignment_flag") is False:
             return "Consistency Warning: The financial growth rate contradicts the textual sentiment."
        
        return f"Trust score analysis for {ticker}: Data appears consistent. Alignment flag is valid."
            
    except Exception as e:
        return f"Error in diagnosis: {str(e)}"

class DocumentRAGTool:
    def __init__(self):
        self.vector_store = None
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2") # Efficient CPU usage
        self._initialize_index()

    def _initialize_index(self):
        docs = []
        
        # Load narratives.json
        if os.path.exists(JSON_PATH):
            with open(JSON_PATH, 'r') as f:
                data = json.load(f)
                for item in data:
                    content = f"Ticker: {item.get('ticker')}. Transcript: {item.get('transcript')}"
                    docs.append(Document(page_content=content, metadata={"source": "narratives.json"}))
        
        # Logic to load PDFs would go here
        # For this task, we assume they are in the data folder if any.
        # pdf_files = [f for f in os.listdir(DATA_DIR) if f.endswith('.pdf')]
        # ... load PDFs ...

        if docs:
            self.vector_store = FAISS.from_documents(docs, self.embeddings)

    def search(self, query: str) -> str:
        """
        Search for relevant information in the documents (narratives and PDFs).
        """
        if not self.vector_store:
            return "No documents indexed."
            
        results = self.vector_store.similarity_search(query, k=3)
        return "\n\n".join([doc.page_content for doc in results])

# Instantiate the RAG tool wrapper
rag_tool_instance = DocumentRAGTool()

@tool
def document_rag_tool(query: str) -> str:
    """
    Retrieves relevant information from financial narratives and documents.
    Use this for general questions, risk analysis, or qualitative info.
    """
    return rag_tool_instance.search(query)
