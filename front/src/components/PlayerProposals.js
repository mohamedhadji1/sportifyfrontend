import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  FiPlus, FiEye, FiEdit, FiTrash2, FiClock, FiCheck, 
  FiX, FiCalendar, FiDollarSign, FiImage, FiSearch, FiFilter
} from 'react-icons/fi';
import EquipmentProposal from './EquipmentProposal';
import './PlayerProposals.css';

const PlayerProposals = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchMyProposals();
  }, [filters]);

  const fetchMyProposals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await fetch(`/api/equipment/proposals?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setProposals(result.data);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = (newProposal) => {
    setProposals(prev => [newProposal, ...prev]);
  };

  const cancelProposal = async (proposalId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette proposition ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/equipment/proposals/${proposalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        alert('Proposition annulée avec succès');
        fetchMyProposals();
      } else {
        alert('Erreur: ' + result.message);
      }
    } catch (error) {
      console.error('Error cancelling proposal:', error);
      alert('Erreur lors de l\'annulation');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { color: '#f59e0b', bg: '#fef3c7', text: 'En attente', icon: FiClock },
      'Under Review': { color: '#3b82f6', bg: '#dbeafe', text: 'En révision', icon: FiEye },
      'Approved': { color: '#10b981', bg: '#d1fae5', text: 'Approuvée', icon: FiCheck },
      'Rejected': { color: '#ef4444', bg: '#fee2e2', text: 'Rejetée', icon: FiX },
      'Cancelled': { color: '#6b7280', bg: '#f3f4f6', text: 'Annulée', icon: FiX }
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    const Icon = config.icon;
    
    return (
      <span 
        className="status-badge"
        style={{ 
          color: config.color, 
          backgroundColor: config.bg 
        }}
      >
        <Icon size={12} />
        {config.text}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      'Low': { color: '#6b7280', bg: '#f3f4f6', text: 'Faible' },
      'Medium': { color: '#f59e0b', bg: '#fef3c7', text: 'Moyenne' },
      'High': { color: '#f97316', bg: '#fed7aa', text: 'Élevée' },
      'Urgent': { color: '#ef4444', bg: '#fee2e2', text: 'Urgente' }
    };

    const config = priorityConfig[priority] || priorityConfig['Medium'];
    
    return (
      <span 
        className="priority-badge"
        style={{ 
          color: config.color, 
          backgroundColor: config.bg 
        }}
      >
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEditProposal = (proposal) => {
    return proposal.status === 'Pending';
  };

  const canCancelProposal = (proposal) => {
    return proposal.status === 'Pending' || proposal.status === 'Under Review';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement de vos propositions...</p>
      </div>
    );
  }

  return (
    <div className="player-proposals">
      <div className="page-header">
        <div className="header-content">
          <div className="title-section">
            <h1>Mes Propositions d'Équipement</h1>
            <p>Proposez de nouveaux équipements pour votre équipe</p>
          </div>
          <button 
            className="create-button"
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus />
            Nouvelle Proposition
          </button>
        </div>

        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-number">{proposals.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {proposals.filter(p => p.status === 'Pending').length}
            </span>
            <span className="stat-label">En attente</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {proposals.filter(p => p.status === 'Approved').length}
            </span>
            <span className="stat-label">Approuvées</span>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filters-row">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Rechercher dans vos propositions..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="all">Tous les statuts</option>
            <option value="Pending">En attente</option>
            <option value="Under Review">En révision</option>
            <option value="Approved">Approuvées</option>
            <option value="Rejected">Rejetées</option>
            <option value="Cancelled">Annulées</option>
          </select>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-content">
            <FiPlus size={64} />
            <h3>Aucune proposition pour le moment</h3>
            <p>Vous n'avez pas encore créé de proposition d'équipement.</p>
            <button 
              className="create-first-button"
              onClick={() => setShowCreateModal(true)}
            >
              Créer ma première proposition
            </button>
          </div>
        </div>
      ) : (
        <div className="proposals-list">
          {proposals.map(proposal => (
            <div key={proposal._id} className="proposal-item">
              <div className="proposal-header">
                <div className="proposal-title">
                  <h3>{proposal.name}</h3>
                  <span className="category-tag">{proposal.category} • {proposal.type}</span>
                </div>
                <div className="proposal-badges">
                  {getStatusBadge(proposal.status)}
                  {getPriorityBadge(proposal.priority)}
                </div>
              </div>

              <div className="proposal-content">
                <div className="proposal-meta">
                  <div className="meta-item">
                    <FiCalendar />
                    <span>Créée le {formatDate(proposal.createdAt)}</span>
                  </div>
                  {proposal.estimatedValue && (
                    <div className="meta-item">
                      <FiDollarSign />
                      <span>{proposal.estimatedValue}€</span>
                    </div>
                  )}
                  {proposal.images?.length > 0 && (
                    <div className="meta-item">
                      <FiImage />
                      <span>{proposal.images.length} image(s)</span>
                    </div>
                  )}
                </div>

                <div className="description">
                  {proposal.description}
                </div>

                {proposal.justification && (
                  <div className="justification">
                    <strong>Justification:</strong>
                    <p>{proposal.justification}</p>
                  </div>
                )}

                {proposal.review && (
                  <div className="review-section">
                    <div className="review-header">
                      <strong>Révision par {proposal.review.reviewedBy.userName}</strong>
                      <span className="review-date">{formatDate(proposal.review.reviewDate)}</span>
                    </div>
                    {proposal.review.comments && (
                      <p className="review-comments">{proposal.review.comments}</p>
                    )}
                    {proposal.review.approvedBudget && (
                      <p className="approved-budget">
                        Budget approuvé: <strong>{proposal.review.approvedBudget}€</strong>
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="proposal-actions">
                <button
                  className="view-button"
                  onClick={() => setSelectedProposal(proposal)}
                >
                  <FiEye />
                  Voir détails
                </button>
                
                {canEditProposal(proposal) && (
                  <button
                    className="edit-button"
                    onClick={() => {
                      // TODO: Implement edit functionality
                      alert('Fonctionnalité d\'édition à implémenter');
                    }}
                  >
                    <FiEdit />
                    Modifier
                  </button>
                )}
                
                {canCancelProposal(proposal) && (
                  <button
                    className="cancel-button"
                    onClick={() => cancelProposal(proposal._id)}
                  >
                    <FiTrash2 />
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de création */}
      {showCreateModal && (
        <EquipmentProposal 
          onClose={() => setShowCreateModal(false)}
          onSubmitSuccess={(newProposal) => {
            handleCreateSuccess(newProposal);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Modal de détails */}
      {selectedProposal && (
        <div className="modal-overlay" onClick={() => setSelectedProposal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProposal.name}</h2>
              <button onClick={() => setSelectedProposal(null)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Informations générales</h3>
                <div className="detail-grid">
                  <div><strong>Catégorie:</strong> {selectedProposal.category}</div>
                  <div><strong>Type:</strong> {selectedProposal.type}</div>
                  <div><strong>État:</strong> {selectedProposal.condition}</div>
                  <div><strong>Priorité:</strong> {selectedProposal.priority}</div>
                  <div><strong>Statut:</strong> {getStatusBadge(selectedProposal.status)}</div>
                  <div><strong>Créée le:</strong> {formatDate(selectedProposal.createdAt)}</div>
                  {selectedProposal.brand && <div><strong>Marque:</strong> {selectedProposal.brand}</div>}
                  {selectedProposal.model && <div><strong>Modèle:</strong> {selectedProposal.model}</div>}
                  {selectedProposal.estimatedValue && <div><strong>Valeur estimée:</strong> {selectedProposal.estimatedValue}€</div>}
                </div>
              </div>

              <div className="detail-section">
                <h3>Description</h3>
                <p>{selectedProposal.description}</p>
              </div>

              <div className="detail-section">
                <h3>Justification</h3>
                <p>{selectedProposal.justification}</p>
              </div>

              {selectedProposal.images?.length > 0 && (
                <div className="detail-section">
                  <h3>Images</h3>
                  <div className="images-grid">
                    {selectedProposal.images.map((image, index) => (
                      <img
                        key={index}
                        src={`/uploads/proposals/${image.filename}`}
                        alt={`Equipment ${index + 1}`}
                        className="equipment-image"
                      />
                    ))}
                  </div>
                </div>
              )}

              {selectedProposal.review && (
                <div className="detail-section">
                  <h3>Révision</h3>
                  <div className="review-info">
                    <div><strong>Décision:</strong> {selectedProposal.review.decision}</div>
                    <div><strong>Révisé par:</strong> {selectedProposal.review.reviewedBy.userName}</div>
                    <div><strong>Date de révision:</strong> {formatDate(selectedProposal.review.reviewDate)}</div>
                    {selectedProposal.review.comments && (
                      <div><strong>Commentaires:</strong> {selectedProposal.review.comments}</div>
                    )}
                    {selectedProposal.review.approvedBudget && (
                      <div><strong>Budget approuvé:</strong> {selectedProposal.review.approvedBudget}€</div>
                    )}
                  </div>
                </div>
              )}

              {selectedProposal.createdEquipmentId && (
                <div className="detail-section">
                  <div className="success-message">
                    <FiCheck />
                    <div>
                      <strong>Équipement créé avec succès!</strong>
                      <p>Votre proposition a été approuvée et l'équipement a été ajouté à l'inventaire.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerProposals;