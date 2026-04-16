export interface IUseCase<I, O> {
    execute(params: I): O;
}
