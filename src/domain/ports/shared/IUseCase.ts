/**
 * Interfaz genérica de caso de uso (driving port).
 *
 * Un caso de uso es una unidad de trabajo: recibe una entrada, produce una salida.
 * Cada acción concreta del sistema (registrar usuario, obtener top activos, …)
 * implementa esta interfaz con tipos concretos.
 */
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
