import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
import time
import threading
import pygame

# Inicializa o mixer do pygame
pygame.mixer.init()

def tocar_bip():
    try:
        pygame.mixer.music.load("cronometro/bip.wav")
        pygame.mixer.music.play()
    except Exception as e:
        print(f"Erro ao reproduzir som: {e}")

class Cronometro:
    def __init__(self, master):
        self.master = master
        self.master.title("Cronômetro Colorido")
        self.master.geometry("400x300")
        self.master.configure(bg="#1e1e2f")

        self.tempo_decorrido = 0
        self.rodando = False

        self.label = tk.Label(master, text="00:00", font=("Arial", 48, "bold"), fg="#00ffcc", bg="#1e1e2f")
        self.label.pack(pady=40)

        self.botoes_frame = tk.Frame(master, bg="#1e1e2f")
        self.botoes_frame.pack()

        self.iniciar_btn = tk.Button(self.botoes_frame, text="Iniciar", font=("Arial", 12), bg="#00cc66", fg="white", width=10, command=self.iniciar)
        self.iniciar_btn.grid(row=0, column=0, padx=10)

        self.parar_btn = tk.Button(self.botoes_frame, text="Parar", font=("Arial", 12), bg="#ff3333", fg="white", width=10, command=self.parar)
        self.parar_btn.grid(row=0, column=1, padx=10)

        self.resetar_btn = tk.Button(self.botoes_frame, text="Resetar", font=("Arial", 12), bg="#3366ff", fg="white", width=10, command=self.resetar)
        self.resetar_btn.grid(row=0, column=2, padx=10)

        # Botão sair no canto superior direito
        self.sair_frame = tk.Frame(master, bg="#1e1e2f")
        self.sair_frame.pack(side="top", anchor="ne", padx=10, pady=10)
        self.sair_btn = tk.Button(self.sair_frame, text="Sair", font=("Arial", 10), bg="#444444", fg="white", command=self.master.quit)
        self.sair_btn.pack()

    def atualizar_tempo(self):
        while self.rodando:
            mins, secs = divmod(self.tempo_decorrido, 60)
            self.label.config(text=f"{mins:02d}:{secs:02d}")
            time.sleep(1)
            self.tempo_decorrido += 1

    def iniciar(self):
        if not self.rodando:
            self.rodando = True
            tocar_bip()
            threading.Thread(target=self.atualizar_tempo, daemon=True).start()

    def parar(self):
        if self.rodando:
            self.rodando = False
            tocar_bip()

    def resetar(self):
        self.rodando = False
        self.tempo_decorrido = 0
        self.label.config(text="00:00")

if __name__ == "__main__":
    root = tk.Tk()
    app = Cronometro(root)
    root.mainloop()
