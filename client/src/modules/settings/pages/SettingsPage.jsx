import React, { useState, useEffect, useRef } from 'react';
import { MainLayout } from '../../../components/layout/MainLayout.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { toast } from 'sonner';
import {
  Building2,
  FileText,
  Shield,
  Save,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import api from '../../../services/api.js';
import { compressImage } from '../../../utils/imageCompressor.js';

export const SettingsPage = () => {
  const { user, currentShop, updateCurrentShop, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const [shopName, setShopName] = useState(user?.shopName || currentShop?.name || '');
  const [businessType, setBusinessType] = useState(currentShop?.businessType || 'Mobile Repair Workshop');
  const [logo, setLogo] = useState(currentShop?.logo || '');
  const [contact, setContact] = useState(currentShop?.phone || currentShop?.shopContactNumber || user?.phone || user?.mobile || '');
  const [email, setEmail] = useState(currentShop?.email || currentShop?.businessEmail || user?.email || '');
  const [address, setAddress] = useState(currentShop?.address || currentShop?.addressLine1 || '');
  const [gst, setGst] = useState(currentShop?.gstNumber || '');
  const [invoicePrefix, setInvoicePrefix] = useState(currentShop?.invoicePrefix || 'INV-');
  const [warrantyDays, setWarrantyDays] = useState(String(currentShop?.warrantyDays || '30'));
  const [footerNote, setFooterNote] = useState(currentShop?.invoiceFooter || 'Thank you for choosing our workshop! Warranty applies on replaced hardware.');
  const [termsAndConditions, setTermsAndConditions] = useState(
    currentShop?.termsAndConditions ||
      '1. Device must be collected within 10 days.\n2. Physical damage and water damage are not covered under warranty.\n3. Warranty is not applicable if another technician opens or repairs the device.\n4. Data loss is not the responsibility of the workshop.'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Load latest settings on mount
  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        if (res) {
          if (res.name || res.shopName) setShopName(res.name || res.shopName);
          if (res.businessType) setBusinessType(res.businessType);
          if (res.logo !== undefined) setLogo(res.logo || '');
          if (res.phone || res.contactNumber || res.shopContactNumber) {
            setContact(res.phone || res.contactNumber || res.shopContactNumber);
          }
          if (res.email || res.businessEmail) setEmail(res.email || res.businessEmail);
          if (res.address || res.addressLine1) setAddress(res.address || res.addressLine1);
          if (res.gstNumber || res.gstin) setGst(res.gstNumber || res.gstin);
          if (res.invoicePrefix) setInvoicePrefix(res.invoicePrefix);
          if (res.warrantyDays) setWarrantyDays(String(res.warrantyDays));
          if (res.footerNote || res.invoiceFooter) setFooterNote(res.footerNote || res.invoiceFooter);
          if (res.termsAndConditions || res.warrantyTerms) {
            setTermsAndConditions(res.termsAndConditions || res.warrantyTerms);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch settings:', err);
      });
  }, []);

  // Process file upload (Validation: PNG, JPG, JPEG, WebP & <= 5MB)
  const handleFileSelected = async (file) => {
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      toast.error('Invalid file format. Only PNG, JPG, JPEG, and WebP images are allowed.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      toast.error('File size exceeds maximum limit of 5 MB.');
      return;
    }

    setIsUploadingLogo(true);
    try {
      let base64Data = '';
      try {
        base64Data = await compressImage(file, 400, 0.85);
      } catch {
        base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      }

      try {
        const res = await api.post('/settings/logo', { image: base64Data });
        const uploadedUrl = res?.logoUrl || res?.data?.logoUrl || base64Data;
        setLogo(uploadedUrl);
        toast.success('Shop logo uploaded and optimized successfully!');

        if (updateCurrentShop) {
          updateCurrentShop({ logo: uploadedUrl });
        }
      } catch (err) {
        // Fallback to local Base64 preview if upload fails
        setLogo(base64Data);
        toast.info('Logo attached to profile. Click "Save Workshop Settings" to persist.');
      }
    } catch (err) {
      toast.error('Failed to process image file.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemoveLogo = () => {
    setLogo('');
    toast.info('Logo removed. Remember to save settings to persist changes.');
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const trimmedName = shopName.trim();
    if (!trimmedName) {
      toast.error('Shop / Workshop Name is required');
      return;
    }

    const trimmedContact = contact.trim();
    if (!trimmedContact) {
      toast.error('Workshop Contact Number is required');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: trimmedName,
        shopName: trimmedName,
        businessType: businessType.trim(),
        logo: logo,
        phone: trimmedContact,
        contactNumber: trimmedContact,
        email: email.trim(),
        businessEmail: email.trim(),
        address: address.trim(),
        addressLine1: address.trim(),
        gstNumber: gst.trim(),
        gstin: gst.trim(),
        invoicePrefix: invoicePrefix.trim(),
        warrantyDays: Number(warrantyDays) || 30,
        footerNote: footerNote.trim(),
        invoiceFooter: footerNote.trim(),
        termsAndConditions: termsAndConditions.trim(),
        warrantyTerms: termsAndConditions.trim(),
      };

      await api.put('/settings', payload);

      if (updateCurrentShop) {
        updateCurrentShop({
          name: trimmedName,
          shopName: trimmedName,
          phone: trimmedContact,
          email: email.trim(),
          address: address.trim(),
          logo: logo,
          gstNumber: gst.trim(),
          businessType: businessType.trim(),
        });
      }

      if (refreshUser) {
        await refreshUser();
      }

      toast.success('Workshop settings updated successfully.');
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error('Unable to update workshop settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout title="Shop Settings" subtitle="Preferences & Configuration">
      <div className="page-header">
        <div className="page-header-info">
          <div className="page-badge-eyebrow">
            <span /> WORKSHOP CONFIGURATION
          </div>
          <h1>Shop Settings & Compliance</h1>
          <p>Manage your workshop branding, invoicing details, and business preferences.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Navigation Tabs Sidebar */}
        <div className="card" style={{ padding: '8px' }}>
          {[
            { id: 'profile', label: 'Shop Profile & Logo', icon: Building2 },
            { id: 'billing', label: 'Invoicing & Tax Rules', icon: FileText },
            { id: 'terms', label: 'Terms & Conditions', icon: Shield },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? '#eff6ff' : 'transparent',
                  color: isSelected ? '#2563eb' : '#475569',
                  fontWeight: isSelected ? '700' : '600',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Settings Content Sheet */}
        <div className="card" style={{ padding: '28px' }}>
          <form onSubmit={handleSave}>
            {activeTab === 'profile' && (
              <div>
                {/* SECTION 1: WORKSHOP PROFILE */}
                <div style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Section: Workshop Profile
                  </span>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>General Branding & Location</h2>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Update your workshop information. These details will appear on invoices, receipts, and official documents.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Shop / Workshop Name *</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="e.g. Smart Mobile Care"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      required
                      disabled={isSaving}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Business Type / Tagline</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="e.g. Mobile & Laptop Repair Workshop"
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* SECTION 2: SHOP LOGO */}
                <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', marginTop: '24px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Section: Shop Logo
                  </span>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Workshop Logo</h3>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: logo ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '24px', alignItems: 'stretch' }}>
                  {/* Upload Dropzone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDragOver ? '#2563eb' : '#cbd5e1'}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '24px',
                      textAlign: 'center',
                      background: isDragOver ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '10px',
                      }}
                    >
                      <Upload size={20} />
                    </div>
                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>
                      {isUploadingLogo ? 'Processing upload...' : 'Click to upload shop logo'}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      or drag and drop image here
                    </span>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px', lineHeight: 1.4 }}>
                      Supported formats: <strong>PNG, JPG, JPEG, WebP</strong> • Max size: <strong>5 MB</strong>
                      <br />
                      Recommended dimensions: <strong>512 x 512 pixels</strong>
                    </div>
                  </div>

                  {/* Logo Preview Card */}
                  {logo && (
                    <div
                      style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Logo Preview
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div
                            style={{
                              width: '72px',
                              height: '72px',
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              overflow: 'hidden',
                              background: '#f8fafc',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={logo}
                              alt="Shop Logo Preview"
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                          <div>
                            <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block' }}>
                              {shopName || 'Workshop Logo'}
                            </strong>
                            <span className="status-badge badge-green" style={{ fontSize: '11px', marginTop: '4px' }}>
                              Active Branding
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSaving || isUploadingLogo}
                          style={{ flex: 1, gap: '4px' }}
                        >
                          <RefreshCw size={13} /> Replace
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={handleRemoveLogo}
                          disabled={isSaving || isUploadingLogo}
                          style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* SECTION 3: CONTACT INFORMATION */}
                <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Section: Contact Information
                  </span>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Communication Details</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Workshop Contact Number *</label>
                    <input
                      type="tel"
                      className="input-control"
                      placeholder="e.g. +91 9876543210"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      required
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Business Email</label>
                    <input
                      type="email"
                      className="input-control"
                      placeholder="e.g. contact@workshop.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                {/* SECTION 4: LOCATION */}
                <div style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Section: Location
                  </span>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Address Details</h3>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Complete Shop Address</label>
                  <textarea
                    className="textarea-control"
                    rows={3}
                    placeholder="e.g. Shop 12, Main Road, Satellite, Ahmedabad, Gujarat - 380015"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div>
                <div style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Invoicing & Tax Rules
                  </span>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>GST & Invoice Configuration</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Invoice Number Prefix</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="INV-"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">GSTIN Identification Number</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="e.g. 24ABCDE1234F1Z5"
                      value={gst}
                      onChange={(e) => setGst(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Invoice Footer Thank You Note</label>
                  <textarea
                    className="textarea-control"
                    rows={2}
                    placeholder="Thank you for choosing our workshop! Warranty applies on replaced hardware."
                    value={footerNote}
                    onChange={(e) => setFooterNote(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            )}

            {activeTab === 'terms' && (
              <div>
                <div style={{ paddingBottom: '14px', borderBottom: '1px solid var(--border-color)', marginBottom: '20px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Warranty & Compliance
                  </span>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>Workshop Terms & Conditions</h2>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Invoice Terms & Conditions (Line by Line) *</label>
                  <textarea
                    className="textarea-control"
                    rows={6}
                    placeholder="1. Device must be collected within 10 days.&#10;2. Physical damage and water damage are not covered under warranty.&#10;3. Warranty is not applicable if another technician opens or repairs the device.&#10;4. Data loss is not the responsibility of the workshop."
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    disabled={isSaving}
                    required
                  />
                  <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Each line will appear as a separate clause on customer receipts and PDF invoices.
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Standard Hardware Warranty Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-control"
                    placeholder="30"
                    value={warrantyDays}
                    onChange={(e) => setWarrantyDays(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            )}

            {/* Save Workshop Settings Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px', paddingTop: '18px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving || isUploadingLogo}
                style={{ padding: '10px 24px', fontSize: '14px', fontWeight: '700' }}
              >
                <Save size={16} /> {isSaving ? 'Saving Workshop Settings...' : 'Save Workshop Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};
