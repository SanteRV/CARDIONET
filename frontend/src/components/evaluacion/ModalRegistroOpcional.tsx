import { Modal } from '../ui/Modal';

interface Props {
  show: boolean;
  onClose: () => void;
  onRegistrarse: () => void;
}

export function ModalRegistroOpcional({ show, onClose, onRegistrarse }: Props) {
  return (
    <Modal show={show} onClose={onClose} title="¿Desea registrarse?">
      <p className="text-muted mb-4">
        ¿Desea registrarse para guardar su historial y acceder a cardiólogos recomendados?
      </p>
      <p className="small text-muted mb-4">
        Es opcional. Podrá continuar viendo los resultados sin cuenta.
      </p>
      <div className="d-flex gap-2 justify-content-end flex-wrap">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Continuar sin registrar
        </button>
        <button type="button" className="btn btn-primary" onClick={onRegistrarse}>
          Sí, registrarme
        </button>
      </div>
    </Modal>
  );
}
