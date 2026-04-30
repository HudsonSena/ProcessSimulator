#include <stdio.h>
#include <pthread.h>

#define NUM_THREADS    5
#define INCREMENTOS  100000

long contador_sem_mutex = 0;   
long contador_com_mutex = 0;   

pthread_mutex_t lock;          


void *incrementa_sem_mutex(void *arg) {
    for (int i = 0; i < INCREMENTOS; i++) {
        contador_sem_mutex++;   
    }
    return NULL;
}

void *incrementa_com_mutex(void *arg) {
    for (int i = 0; i < INCREMENTOS; i++) {
        pthread_mutex_lock(&lock);    
        contador_com_mutex++;         
        pthread_mutex_unlock(&lock);  
    }
    return NULL;
}

int main(void) {
    pthread_t threads[NUM_THREADS];

    long esperado = (long)NUM_THREADS * INCREMENTOS;
    printf("Valor esperado: %ld\n\n", esperado);

    printf("=== SEM MUTEX (race condition) ===\n");
    for (int i = 0; i < NUM_THREADS; i++)
        pthread_create(&threads[i], NULL, incrementa_sem_mutex, NULL);
    for (int i = 0; i < NUM_THREADS; i++)
        pthread_join(threads[i], NULL);
    printf("Resultado: %ld  →  %s\n\n",
           contador_sem_mutex,
           contador_sem_mutex == esperado ? "CORRETO" : "ERRADO (dados corrompidos!)");

    printf("=== COM MUTEX (protegido) ===\n");
    pthread_mutex_init(&lock, NULL);   

    for (int i = 0; i < NUM_THREADS; i++)
        pthread_create(&threads[i], NULL, incrementa_com_mutex, NULL);
    for (int i = 0; i < NUM_THREADS; i++)
        pthread_join(threads[i], NULL);

    printf("Resultado: %ld  →  %s\n",
           contador_com_mutex,
           contador_com_mutex == esperado ? "CORRETO" : "ERRADO");

    pthread_mutex_destroy(&lock);     
    return 0;
}



