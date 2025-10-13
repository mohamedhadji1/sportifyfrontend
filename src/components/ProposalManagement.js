import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  FiCheck, FiX, FiEye, FiClock, FiUser, FiCalendar, 
  FiDollarSign, FiMapPin, FiTag, FiMessageSquare,
  FiImage, FiFilter, FiSearch
} from 'react-icons/fi';
import './ProposalManagement.css';

const ProposalManagement = () => {
  const { user } = useAuth();
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    decision: '',
    comments: '',
    approvedBudget: ''
  });
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: ''
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchProposals();
    fetchStats();
  }, [filters]);

  const fetchProposals = async () => {
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

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/equipment/proposals/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewData.decision) {
      alert('Veuillez sélectionner une décision');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/equipment/proposals/${selectedProposal._id}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`Proposition ${reviewData.decision === 'Approved' ? 'approuvée' : 'rejetée'} avec succès`);
        setShowReviewModal(false);
        setSelectedProposal(null);
        setReviewData({ decision: '', comments: '', approvedBudget: '' });
        fetchProposals();
        fetchStats();
      } else {
        alert('Erreur: ' + result.message);
      }
    } catch (error) {
      console.error('Error reviewing proposal:', error);
      alert('Erreur lors de la révision');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { color: '#f59e0b', bg: '#fef3c7', text: 'En attente' },
      'Under Review': { color: '#3b82f6', bg: '#dbeafe', text: 'En révision' },
      'Approved': { color: '#10b981', bg: '#d1fae5', text: 'Approuvée' },
      'Rejected': { color: '#ef4444', bg: '#fee2e2', text: 'Rejetée' },
      'Cancelled': { color: '#6b7280', bg: '#f3f4f6', text: 'Annulée' }
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    
    return (
      <span 
        className="status-badge"
        style={{ 
          color: config.color, 
          backgroundColor: config.bg 
        }}
      >
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
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des propositions...</p>
      </div>
    );
  }

  return (
    <div className="proposal-management">
      <div className="page-header">
        <h1>Gestion des Propositions d'Équipement</h1>
        
        {stats && (
          <div className="stats-grid">
            <div className="stat-card pending">
              <div className="stat-number">{stats.pendingProposals}</div>
              <div className="stat-label">En attente</div>
            </div>
            <div className="stat-card total">
              <div className="stat-number">{stats.totalProposals}</div>
              <div className="stat-label">Total</div>
            </div>
          </div>
        )}
      </div>

      <div className="filters-section">
        <div className="filters-row">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Rechercher une proposition..."
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
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
          >
            <option value="all">Toutes priorités</option>
            <option value="Urgent">Urgente</option>
            <option value="High">Élevée</option>
            <option value="Medium">Moyenne</option>
            <option value="Low">Faible</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
          >
            <option value="all">Toutes catégories</option>
            <option value="Football">Football</option>
            <option value="Basketball">Basketball</option>
            <option value="Tennis">Tennis</option>
            <option value="Volleyball">Volleyball</option>
            <option value="Swimming">Natation</option>
            <option value="Gym">Gym</option>
            <option value="Track & Field">Athlétisme</option>
            <option value="Other">Autre</option>
          </select>
        </div>
      </div>

      <div className="proposals-grid">
        {proposals.length === 0 ? (
          <div className="no-proposals">
            <FiEye size={48} />
            <h3>Aucune proposition trouvée</h3>
            <p>Il n'y a pas de propositions d'équipement correspondant aux critères sélectionnés.</p>
          </div>
        ) : (
          proposals.map(proposal => (
            <div key={proposal._id} className="proposal-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{proposal.name}</h3>
                  <span className="category-tag">{proposal.category}</span>
                </div>
                <div className="card-badges">
                  {getStatusBadge(proposal.status)}
                  {getPriorityBadge(proposal.priority)}
                </div>
              </div>

              <div className="card-content">
                <p className="description">{proposal.description}</p>
                
                <div className="proposal-meta">
                  <div className="meta-item">
                    <FiUser />
                    <span>Proposé par: {proposal.proposedBy.userName}</span>
                  </div>
                  <div className="meta-item">
                    <FiCalendar />
                    <span>{formatDate(proposal.createdAt)}</span>
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

                <div className="justification">
                  <strong>Justification:</strong>
                  <p>{proposal.justification}</p>
                </div>
              </div>

              <div className="card-actions">
                <button
                  className="view-button"
                  onClick={() => setSelectedProposal(proposal)}
                >
                  <FiEye />
                  Voir détails
                </button>
                
                {(proposal.status === 'Pending' || proposal.status === 'Under Review') && (
                  <button
                    className="review-button"
                    onClick={() => {
                      setSelectedProposal(proposal);
                      setShowReviewModal(true);
                    }}
                  >
                    <FiMessageSquare />
                    Réviser
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de détails */}
      {selectedProposal && !showReviewModal && (
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
            </div>
          </div>
        </div>
      )}

      {/* Modal de révision */}
      {showReviewModal && selectedProposal && (
        <div className="modal-overlay">
          <div className="modal-content review-modal">
            <div className="modal-header">
              <h2>Réviser la proposition</h2>
              <button onClick={() => setShowReviewModal(false)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              <div className="proposal-summary">
                <h3>{selectedProposal.name}</h3>
                <p>Proposé par: {selectedProposal.proposedBy.userName}</p>
              </div>

              <div className="review-form">
                <div className="form-group">
                  <label>Décision *</label>
                  <select
                    value={reviewData.decision}
                    onChange={(e) => setReviewData(prev => ({ ...prev, decision: e.target.value }))}
                  >
                    <option value="">Sélectionner une décision</option>
                    <option value="Approved">Approuver</option>
                    <option value="Rejected">Rejeter</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Commentaires</label>
                  <textarea
                    value={reviewData.comments}
                    onChange={(e) => setReviewData(prev => ({ ...prev, comments: e.target.value }))}
                    placeholder="Ajoutez des commentaires sur votre décision..."
                    rows="4"
                  />
                </div>

                {reviewData.decision === 'Approved' && (
                  <div className="form-group">
                    <label>Budget approuvé (€)</label>
                    <input
                      type="number"
                      value={reviewData.approvedBudget}
                      onChange={(e) => setReviewData(prev => ({ ...prev, approvedBudget: e.target.value }))}
                      placeholder="Montant autorisé pour l'achat"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              <div className="review-actions">
                <button 
                  className="cancel-button"
                  onClick={() => setShowReviewModal(false)}
                >
                  Annuler
                </button>
                <button 
                  className={`submit-button ${reviewData.decision === 'Approved' ? 'approve' : 'reject'}`}
                  onClick={handleReviewSubmit}
                >
                  {reviewData.decision === 'Approved' ? (
                    <>
                      <FiCheck />
                      Approuver
                    </>
                  ) : (
                    <>
                      <FiX />
                      Rejeter
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalManagement;