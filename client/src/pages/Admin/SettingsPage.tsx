import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Table, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FaCog, FaSave, FaPlus, FaTrash, FaPercent, FaGlobe } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getVatSettings, updateVatSettings } from '@/api/admin.api';
import type { VatSettings, VatMode } from '@/api/admin.api';
import { Navbar, Footer } from '@/components/layout';
import './SettingsPage.css';

// Country names for display
const COUNTRY_NAMES: Record<string, string> = {
  RU: 'Russia',
  GB: 'United Kingdom',
  DE: 'Germany',
  AE: 'UAE',
  US: 'USA',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  PL: 'Poland',
  CA: 'Canada',
  AU: 'Australia',
  JP: 'Japan',
  CN: 'China',
  IN: 'India',
  BR: 'Brazil',
};

export function SettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Local form state
  const [mode, setMode] = useState<VatMode>('included');
  const [defaultRate, setDefaultRate] = useState<number>(20);
  const [countryRates, setCountryRates] = useState<Record<string, number>>({});
  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryRate, setNewCountryRate] = useState<number>(20);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch current settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['admin', 'settings', 'vat'],
    queryFn: getVatSettings,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateVatSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'vat'] });
      toast.success('VAT settings saved successfully');
      setIsDirty(false);
    },
    onError: (error: Error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  // Sync form state when settings load
  useEffect(() => {
    if (settings) {
      setMode(settings.mode || 'included');
      setDefaultRate(settings.default_rate ?? 20);
      setCountryRates({ ...(settings.country_rates || {}) });
    }
  }, [settings]);

  // Handle form changes
  const handleModeChange = (newMode: VatMode) => {
    setMode(newMode);
    setIsDirty(true);
  };

  const handleDefaultRateChange = (value: string) => {
    const rate = parseFloat(value);
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      setDefaultRate(rate);
      setIsDirty(true);
    }
  };

  const handleCountryRateChange = (country: string, value: string) => {
    const rate = parseFloat(value);
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      setCountryRates((prev) => ({ ...prev, [country]: rate }));
      setIsDirty(true);
    }
  };

  const handleAddCountry = () => {
    const code = newCountryCode.toUpperCase().trim();
    if (code.length !== 2) {
      toast.error('Country code must be 2 letters (e.g., RU, US, DE)');
      return;
    }
    if (countryRates[code] !== undefined) {
      toast.error(`Country ${code} already exists`);
      return;
    }
    setCountryRates((prev) => ({ ...prev, [code]: newCountryRate }));
    setNewCountryCode('');
    setNewCountryRate(20);
    setIsDirty(true);
  };

  const handleRemoveCountry = (country: string) => {
    setCountryRates((prev) => {
      const newRates = { ...prev };
      delete newRates[country];
      return newRates;
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    // Ensure all values are numbers before sending
    const numericCountryRates: Record<string, number> = {};
    for (const [key, val] of Object.entries(countryRates)) {
      numericCountryRates[key] = Number(val);
    }

    updateMutation.mutate({
      mode,
      default_rate: Number(defaultRate),
      country_rates: numericCountryRates,
    });
  };

  const handleReset = () => {
    if (settings) {
      setMode(settings.mode || 'included');
      setDefaultRate(settings.default_rate ?? 20);
      setCountryRates({ ...(settings.country_rates || {}) });
      setIsDirty(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Container className="admin-settings py-4">
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading settings...</p>
          </div>
        </Container>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Container className="admin-settings py-4">
          <Alert variant="danger">
            <h4>Error loading settings</h4>
            <p>{error instanceof Error ? error.message : 'Failed to load settings'}</p>
          </Alert>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container className="admin-settings py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>
            <FaCog className="me-2" />
            Platform Settings
          </h1>
          {isDirty && (
            <Badge bg="warning" text="dark">
              Unsaved changes
            </Badge>
          )}
        </div>

        {/* Current Settings Summary */}
        {settings && (
          <Alert variant="light" className="current-settings-alert mb-4">
            <h5 className="mb-3">Current Settings (saved in database)</h5>
            <Row>
              <Col md={4}>
                <strong>Mode:</strong>{' '}
                <Badge bg={settings.mode === 'included' ? 'success' : 'primary'}>
                  {settings.mode === 'included' ? 'VAT Included in Price' : 'VAT Added On Top'}
                </Badge>
              </Col>
              <Col md={4}>
                <strong>Default Rate:</strong> {settings.default_rate}%
              </Col>
              <Col md={4}>
                <strong>Countries:</strong> {Object.keys(settings.country_rates || {}).length} configured
              </Col>
            </Row>
          </Alert>
        )}

        {/* VAT Settings Card */}
        <Card className="settings-card mb-4">
          <Card.Header>
            <FaPercent className="me-2" />
            VAT / Tax Settings
          </Card.Header>
          <Card.Body>
            {/* VAT Mode */}
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">VAT Mode</Form.Label>
                  <p className="text-muted small mb-2">
                    Choose how VAT/tax is applied to product prices
                  </p>
                  <div className="vat-mode-selector">
                    <Form.Check
                      type="radio"
                      id="vat-included"
                      name="vatMode"
                      label={
                        <span>
                          <strong>VAT Included</strong>
                          <br />
                          <small className="text-muted">
                            Prices already include VAT (common in EU, Russia)
                          </small>
                        </span>
                      }
                      checked={mode === 'included'}
                      onChange={() => handleModeChange('included')}
                      className="mb-3"
                    />
                    <Form.Check
                      type="radio"
                      id="vat-on-top"
                      name="vatMode"
                      label={
                        <span>
                          <strong>VAT On Top</strong>
                          <br />
                          <small className="text-muted">
                            VAT added to prices at checkout (common in USA)
                          </small>
                        </span>
                      }
                      checked={mode === 'on_top'}
                      onChange={() => handleModeChange('on_top')}
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Default VAT Rate (%)</Form.Label>
                  <p className="text-muted small mb-2">
                    Applied when no country-specific rate is set
                  </p>
                  <div className="d-flex align-items-center">
                    <Form.Control
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={defaultRate}
                      onChange={(e) => handleDefaultRateChange(e.target.value)}
                      className="rate-input"
                    />
                    <span className="ms-2">%</span>
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {/* Country Rates Table */}
            <div className="mb-4">
              <h5 className="mb-3">
                <FaGlobe className="me-2" />
                Country-Specific Rates
              </h5>
              <Table striped bordered hover responsive className="country-rates-table">
                <thead>
                  <tr>
                    <th>Country Code</th>
                    <th>Country Name</th>
                    <th>VAT Rate (%)</th>
                    <th style={{ width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(countryRates)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([country, rate]) => (
                      <tr key={country}>
                        <td>
                          <Badge bg="secondary">{country}</Badge>
                        </td>
                        <td>{COUNTRY_NAMES[country] || country}</td>
                        <td>
                          <Form.Control
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={rate}
                            onChange={(e) => handleCountryRateChange(country, e.target.value)}
                            className="rate-input-small"
                          />
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleRemoveCountry(country)}
                            title="Remove country"
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  {Object.keys(countryRates).length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted py-3">
                        No country-specific rates. Default rate will be used.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Add Country Form */}
              <div className="add-country-form">
                <Row className="align-items-end g-2">
                  <Col xs={4} md={3}>
                    <Form.Label className="small">Country Code</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., FR"
                      maxLength={2}
                      value={newCountryCode}
                      onChange={(e) => setNewCountryCode(e.target.value.toUpperCase())}
                    />
                  </Col>
                  <Col xs={4} md={3}>
                    <Form.Label className="small">VAT Rate (%)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={newCountryRate}
                      onChange={(e) => setNewCountryRate(parseFloat(e.target.value) || 0)}
                    />
                  </Col>
                  <Col xs={4} md={3}>
                    <Button variant="outline-primary" onClick={handleAddCountry}>
                      <FaPlus className="me-1" />
                      Add Country
                    </Button>
                  </Col>
                </Row>
              </div>
            </div>

            {/* Info Alert */}
            <Alert variant="info" className="mb-0">
              <strong>Note:</strong> For USA (US), sales tax is handled separately by state.
              Setting US rate to 0% is recommended - state-level rates are calculated at checkout.
            </Alert>
          </Card.Body>
        </Card>

        {/* Action Buttons */}
        <div className="d-flex justify-content-end gap-2">
          <Button
            variant="outline-secondary"
            onClick={handleReset}
            disabled={!isDirty || updateMutation.isPending}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isDirty || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="me-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </Container>
      <Footer />
    </>
  );
}

export default SettingsPage;
