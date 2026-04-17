
export interface IPresenter<TDomain, TView> {
  present(model: TDomain): TView;
  presentMany(models: TDomain[]): TView[];
}
