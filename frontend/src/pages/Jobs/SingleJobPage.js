import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, collection, serverTimestamp, updateDoc, increment, query, where, getDocs } from 'firebase/firestore';
import Header from '../../components/common/Header';
import { jobService } from '../../services';
import { saveJob, removeSavedJob, isJobSaved } from '../../services/savedJobs';
import './SingleJobPage.css';

const SingleJobPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    resumeUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [savingJob, setSavingJob] = useState(false);
  const { user, isAuthenticated, isEmployer } = useAuth();
  const navigate = useNavigate();

  // Check if current user is the owner
  const isOwner = job && user && job.employerId === user.uid;
  
  // Check if job is active
  const isActive = job && job.status === 'active';

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        console.log("Fetching job with ID:", jobId);
        
        // Get job document from Firestore
        const jobDocRef = doc(db, 'jobs', jobId);
        const jobDoc = await getDoc(jobDocRef);
        
        if (!jobDoc.exists()) {
          console.log("Job not found");
          setError("İş ilanı bulunamadı.");
          setLoading(false);
          return;
        }
        
        const jobData = {
          id: jobDoc.id,
          ...jobDoc.data(),
          createdAt: jobDoc.data().createdAt?.toDate(),
          updatedAt: jobDoc.data().updatedAt?.toDate(),
          deadline: jobDoc.data().deadline?.toDate()
        };
        
        console.log("Job data loaded:", jobData);
        setJob(jobData);
        
        if (isAuthenticated() && user) {
          // Check if user has already applied
          if (!isEmployer()) {
            const applicationsRef = collection(db, 'applications');
            const q = query(
              applicationsRef,
              where('jobId', '==', jobId),
              where('userId', '==', user.uid)
            );
            
            const querySnapshot = await getDocs(q);
            setHasApplied(!querySnapshot.empty);
            
            // Check if job is saved
            const saved = await isJobSaved(user.uid, jobId);
            setIsSaved(saved);
            
            // Increment view count
            await updateDoc(jobDocRef, {
              viewCount: increment(1)
            });
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching job:", err);
        setError("İş detayları yüklenirken bir hata oluştu.");
        setLoading(false);
      }
    };
    
    fetchJob();
  }, [jobId, user, isAuthenticated, isEmployer]);
  
  const handleApply = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
      navigate('/auth/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }
    
    if (!applicationData.coverLetter.trim()) {
      alert("Lütfen bir başvuru mektubu girin.");
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create application data
      const applicationDetails = {
        coverLetter: applicationData.coverLetter,
        resumeUrl: applicationData.resumeUrl
      };
      
      // Call the jobService applyToJob function
      await jobService.applyToJob(jobId, user.uid, applicationDetails);
      
      // Update state
      setHasApplied(true);
      setShowApplyForm(false);
      alert("Başvurunuz başarıyla gönderildi!");
      
    } catch (err) {
      console.error("Error submitting application:", err);
      alert("Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // İş ilanını kaydetme/kaydetmeyi kaldırma işlemi
  const handleSaveToggle = async () => {
    if (!isAuthenticated()) {
      navigate('/auth/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }
    
    try {
      setSavingJob(true);
      
      if (isSaved) {
        // İşi kayıtlardan kaldır
        await removeSavedJob(user.uid, jobId);
        setIsSaved(false);
      } else {
        // İşi kaydet
        await saveJob(user.uid, jobId);
        setIsSaved(true);
      }
    } catch (err) {
      console.error("Error toggling saved job:", err);
      alert(isSaved 
        ? "İş kaydı kaldırılırken bir hata oluştu." 
        : "İş kaydedilirken bir hata oluştu.");
    } finally {
      setSavingJob(false);
    }
  };
  
  // Form input change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  if (loading) {
    return (
      <div className="single-job-page">
        <Header />
        <div className="container">
          <div className="loading-spinner">Yükleniyor...</div>
        </div>
      </div>
    );
  }
  
  if (error || !job) {
    return (
      <div className="single-job-page">
        <Header />
        <div className="container">
          <div className="error-message">{error || "İş detayları yüklenemedi."}</div>
          <Link to="/jobs" className="back-link">İş İlanları Sayfasına Dön</Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="single-job-page">
      <Header />
      <div className="container">
        <div className="job-header">
          <div className="job-title-info">
            <h1>{job.title}</h1>
            <div className="company-location">
              <span className="company">{job.company}</span>
              <span className="location">📍 {job.location}</span>
            </div>
          </div>
          
          <div className="job-actions">
            {isOwner ? (
              <>
                <Link to={`/jobs/edit/${jobId}`} className="btn btn-secondary">Düzenle</Link>
                <button className="btn btn-danger">Sil</button>
              </>
            ) : !isEmployer() && (
              <div className="action-buttons">
                {isActive && (
                  <button 
                    className={`btn btn-primary ${hasApplied ? 'applied' : ''}`}
                    onClick={() => hasApplied ? null : setShowApplyForm(true)}
                    disabled={hasApplied || submitting}
                  >
                    {hasApplied ? 'Başvuruldu' : submitting ? 'İşleniyor...' : 'Başvur'}
                  </button>
                )}
                <button 
                  className={`btn btn-save ${isSaved ? 'saved' : ''}`}
                  onClick={handleSaveToggle}
                  disabled={savingJob}
                >
                  {isSaved ? '★ Kaydedildi' : '☆ Kaydet'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="job-details">
          <div className="job-info-bar">
            <div className="info-item">
              <strong>Durum:</strong> 
              <span className={`status-badge ${job.status}`}>
                {job.status === 'active' ? 'Aktif' : 
                 job.status === 'closed' ? 'Kapalı' : 
                 job.status === 'draft' ? 'Taslak' : job.status}
              </span>
            </div>
            <div className="info-item">
              <strong>Tür:</strong> 
              <span>
                {job.type === 'full-time' ? 'Tam Zamanlı' : 
                 job.type === 'part-time' ? 'Yarı Zamanlı' : 
                 job.type === 'contract' ? 'Sözleşmeli' : 
                 job.type === 'internship' ? 'Staj' : job.type}
              </span>
            </div>
            <div className="info-item">
              <strong>Kategori:</strong> 
              <span>{job.category}</span>
            </div>
            {job.deadline && (
              <div className="info-item">
                <strong>Son Başvuru:</strong> 
                <span>{job.deadline.toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          {/* İşe Hızlı Başvuru Butonu - Mobil İçin */}
          {!isOwner && !isEmployer() && isActive && !hasApplied && (
            <div className="mobile-apply-btn">
              <button 
                className="btn btn-primary btn-block"
                onClick={() => setShowApplyForm(true)}
                disabled={submitting}
              >
                {submitting ? 'İşleniyor...' : 'Hemen Başvur'}
              </button>
            </div>
          )}
          
          {job.salary && job.salary.min > 0 && (
            <div className="job-section">
              <h3>Maaş Aralığı</h3>
              <p className="salary">
                {job.salary.min} - {job.salary.max} {job.salary.currency || 'TRY'}
              </p>
            </div>
          )}
          
          <div className="job-section">
            <h3>İş Tanımı</h3>
            <div className="job-description">
              <h3>Salary Range</h3>
              <p>{job.salaryRange}</p>
              
              <h3>Job Description</h3>
              {job.description.split('\n').map((paragraph, index) => (
                paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
              ))}
            </div>
          </div>
          
          {job.requirements && job.requirements.length > 0 && (
            <div className="job-section">
              <h3>Gereksinimler</h3>
              <ul className="requirements-list">
                {job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          
          {job.skills && job.skills.length > 0 && (
            <div className="job-section">
              <h3>Yetenekler</h3>
              <div className="skills-container">
                {job.skills.map((skill, index) => (
                  <span key={index} className="skill-badge">{skill}</span>
                ))}
              </div>
            </div>
          )}
          
          <div className="job-footer">
            <div className="job-meta">
              <div className="meta-item">
                <strong>Eklenme Tarihi:</strong> {job.createdAt?.toLocaleDateString() || 'N/A'}
              </div>
              <div className="meta-item">
                <strong>Görüntülenme:</strong> {job.viewCount || 0}
              </div>
              <div className="meta-item">
                <strong>Başvuru Sayısı:</strong> {job.applicationCount || 0}
              </div>
            </div>
            
            <div className="job-footer-actions">
              <Link to="/jobs" className="btn btn-secondary">
                İş İlanları Sayfasına Dön
              </Link>
              
              {!isOwner && !isEmployer() && isActive && !hasApplied && (
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowApplyForm(true)}
                  disabled={submitting}
                >
                  {submitting ? 'İşleniyor...' : 'Başvur'}
                </button>
              )}
            </div>
          </div>
          
          {/* Application Form */}
          {showApplyForm && !hasApplied && (
            <div className="application-form-container">
              <div className="form-header">
                <h3>İş Başvurusu - {job.title}</h3>
                <button 
                  className="close-btn"
                  onClick={() => setShowApplyForm(false)}
                  type="button"
                  disabled={submitting}
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleApply}>
                <div className="form-group">
                  <label htmlFor="coverLetter">Başvuru Mektubu *</label>
                  <textarea 
                    id="coverLetter"
                    name="coverLetter"
                    value={applicationData.coverLetter}
                    onChange={handleInputChange}
                    rows="6"
                    placeholder="Introduce yourself and explain why you're a good fit for this position..."
                    required
                    disabled={submitting}
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label htmlFor="resumeUrl">CV URL (Opsiyonel)</label>
                  <input
                    type="url"
                    id="resumeUrl"
                    name="resumeUrl"
                    value={applicationData.resumeUrl}
                    onChange={handleInputChange}
                    placeholder="URL to your online resume"
                    disabled={submitting}
                  />
                  <small>Dosya yükleme sistemi henüz aktif değil. CV'nizi online bir kaynağa yükleyip link paylaşabilirsiniz.</small>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowApplyForm(false)}
                    disabled={submitting}
                  >
                    İptal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Gönderiliyor...' : 'Başvuru Gönder'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {hasApplied && (
            <div className="applied-message">
              <p>Bu iş ilanına zaten başvurdunuz. Başvurunuz değerlendirme aşamasındadır.</p>
            </div>
          )}
          
          {isOwner && (
            <div className="employer-actions">
              <Link to={`/jobs/${jobId}/applications`} className="btn btn-primary">
                Başvuruları Görüntüle ({job.applicationCount || 0})
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleJobPage; 