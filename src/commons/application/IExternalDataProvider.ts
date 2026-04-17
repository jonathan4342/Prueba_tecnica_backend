export interface IExternalDataProvider<TQuery, TResult> {
  fetch(query: TQuery): Promise<TResult>;
}
