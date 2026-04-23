#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

int *vetor;
int tamanho = 6;

pthread_mutex_t mutex;

// Ordenar vetor
void* ordenar(void* arg) {
    pthread_mutex_lock(&mutex);

    for (int i = 0; i < tamanho - 1; i++) {
        for (int j = i + 1; j < tamanho; j++) {
            if (vetor[i] > vetor[j]) {
                int temp = vetor[i];
                vetor[i] = vetor[j];
                vetor[j] = temp;
            }
        }
    }

    printf("Thread Ordenar: ");
    for (int i = 0; i < tamanho; i++) {
        printf("%d ", vetor[i]);
    }
    printf("\n");

    pthread_mutex_unlock(&mutex);
    pthread_exit(NULL);
}

// Adicionar número (fixo para evitar time.h)
void* adicionar(void* arg) {
    int num = 42; // número fixo (sem usar rand/time)

    pthread_mutex_lock(&mutex);

    vetor = realloc(vetor, (tamanho + 1) * sizeof(int));
    vetor[tamanho] = num;
    tamanho++;

    printf("Thread Adicionar: adicionou %d\n", num);

    pthread_mutex_unlock(&mutex);
    pthread_exit(NULL);
}

// Remover elemento (último)
void* remover(void* arg) {
    pthread_mutex_lock(&mutex);

    if (tamanho > 0) {
        int removido = vetor[tamanho - 1];
        tamanho--;

        vetor = realloc(vetor, tamanho * sizeof(int));

        printf("Thread Remover: removeu %d\n", removido);
    } else {
        printf("Thread Remover: vetor vazio\n");
    }

    pthread_mutex_unlock(&mutex);
    pthread_exit(NULL);
}

// Calcular média
void* media(void* arg) {
    float resultado = 0;

    pthread_mutex_lock(&mutex);

    if (tamanho > 0) {
        int soma = 0;
        for (int i = 0; i < tamanho; i++) {
            soma += vetor[i];
        }
        resultado = (float)soma / tamanho;
        printf("Thread Media: %.2f\n", resultado);
    } else {
        printf("Thread Media: vetor vazio\n");
    }

    pthread_mutex_unlock(&mutex);
    pthread_exit(NULL);
}

int main() {
    pthread_t t1, t2, t3, t4;

    pthread_mutex_init(&mutex, NULL);

    // Alocando vetor inicial
    vetor = malloc(tamanho * sizeof(int));
    int inicial[] = {10, 3, 5, 8, 2, 7};

    for (int i = 0; i < tamanho; i++) {
        vetor[i] = inicial[i];
    }

    // Criando threads
    pthread_create(&t1, NULL, ordenar, NULL);
    pthread_create(&t2, NULL, adicionar, NULL);
    pthread_create(&t3, NULL, remover, NULL);
    pthread_create(&t4, NULL, media, NULL);

    // Espera finalizar
    pthread_join(t1, NULL);
    pthread_join(t2, NULL);
    pthread_join(t3, NULL);
    pthread_join(t4, NULL);

    // Estado final
    printf("\nVetor final: ");
    for (int i = 0; i < tamanho; i++) {
        printf("%d ", vetor[i]);
    }
    printf("\n");

    free(vetor);
    pthread_mutex_destroy(&mutex);

    return 0;
}