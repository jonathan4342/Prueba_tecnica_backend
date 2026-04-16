/**
 * Interfaz genérica de presentador.
 *
 * Un presentador convierte un modelo de dominio (TDomain) en un modelo
 * de vista (TView) apto para ser serializado al cliente. Es el ÚNICO
 * sitio donde se decide "cómo se ve" el dato; ni el caso de uso ni el
 * controlador deben conocer el formato externo.
 */
export interface IPresenter<TDomain, TView> {
  present(model: TDomain): TView;
  presentMany(models: TDomain[]): TView[];
}
