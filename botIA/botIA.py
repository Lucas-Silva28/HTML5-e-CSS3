from sentence_transformers import SentenceTransformer # type: ignore
from sklearn.metrics.pairwise import cosine_similarity
from tkinter import messagebox

# Inicializar o modelo de embeddings
try:
    modelo = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:  
    print(f"Erro ao inicializar o modelo: {e}")
    exit()

# Base de conhecimento
base_conhecimento = {
    "O que é administração": "Administração é o processo de planejar, organizar, dirigir e controlar recursos para alcançar objetivos organizacionais.",
    "Funções da administração": "As funções principais são: Planejamento, Organização, Direção e Controle (PODC).",
    "O que é planejamento estratégico": "É o processo de definir a direção da organização a longo prazo, com base em sua missão, visão e valores.",
    "O que é controle": "É a função administrativa que garante que os objetivos sejam alcançados por meio da comparação entre o desempenho planejado e o real.",
    "Tipos de liderança": "Liderança autocrática, democrática e liberal (laissez-faire) são os principais estilos."
}

# Pré-calcular embeddings da base
try:
    perguntas = list(base_conhecimento.keys())
    embeddings_base = modelo.encode(perguntas, convert_to_tensor=True)
except Exception as e:
    print(f"Erro ao calcular embeddings: {e}")
    exit()

# Função para responder usando IA
def responder_pergunta():
    pergunta = entry_pergunta.get().strip()
    if not pergunta:
        messagebox.showwarning("Aviso", "Digite uma pergunta.")
        return

    # Calcular embedding da pergunta do usuário
    try:
        embedding_pergunta = modelo.encode([pergunta], convert_to_tensor=True)
        similaridades = cosine_similarity(embedding_pergunta, embeddings_base)
        indice_mais_proximo = similaridades.argmax()
        resposta = base_conhecimento[perguntas[indice_mais_proximo]]
        messagebox.showinfo("Resposta", resposta)
    except Exception as e:
        messagebox.showerror("Erro", f"Erro ao processar a pergunta: {e}")
