#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#define TAM 10

int vetor[TAM] = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

void show(int *vetor, int tam) {
    int i = 0;
    printf("Vetor: ");
    for (i = 0; i < tam; i++) {
        printf("%d ", vetor[i]);
    }
    printf("\n");
    pthread_exit(NULL);
}
/*
float threadSoma(float *a, float tam) {
    printf("---Thread 1 Soma--- ");
    float soma = 0;
    int i = 0;
    for (i = 0; i < tam; i++) {
        soma += a[i];
    }
    printf("soma: %f\n", soma);
    return *a;
}

float threadMedia(float *a, float tam) {
    printf("---Thread 2 Media--- ");
    float soma = 0;
    int i = 0;
    for (i = 0; i < tam; i++) {
        soma += a[i];
    }
    float media = soma/tam;
    printf("media: %f\n", media);
    return *a;
}

float threadPares(float *a, float tam) {
    printf("---Thread 3 Pares--- ");
    float soma = 0;
    int i = 0;
    for (i = 0; i < tam; i++) {
        if ((int)a[i] % 2 == 0) {
            soma += a[i];
        }
    }
    printf("soma dos pares: %f\n", soma);
    return *a;
}

float threadMaior(float *a, float tam) {
    printf("---Thread 4 Maior Valor--- ");
    float maior = a[0];
    int i = 0;
    for (i = 1; i < tam; i++) {
        if (a[i] > maior) {
            maior = a[i];
        }
    }
    printf("maior: %f\n", maior);
    return *a;
}
*/
int main() {
    pthread_t threads[4];
    pthread_create(&threads[0], NULL, (void *)show, (void *)vetor);
    pthread_join(threads[0], NULL);
    //threadSoma(a, tam);
    //threadMedia(a, tam);
    //threadPares(a, tam);
    //threadMaior(a, tam);
    return 0;
}