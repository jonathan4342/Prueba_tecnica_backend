/**
 * Interfaz genérica para proveedores de datos externos.
 *
 * Abstrae la idea de "recibir una consulta, devolver un resultado".
 * El dominio no sabe si por debajo hay HTTP, gRPC o una cola de mensajes.
 */
export interface IExternalDataProvider<TQuery, TResult> {
  fetch(query: TQuery): Promise<TResult>;
}
