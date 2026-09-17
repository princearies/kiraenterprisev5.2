CREATE TABLE IF NOT EXISTS client_entries (client_id TEXT PRIMARY KEY, entity_name TEXT, entity_type TEXT, status TEXT, company_meta TEXT);
CREATE TABLE IF NOT EXISTS journal_entries (id TEXT PRIMARY KEY, company_id TEXT, client_id TEXT, date TEXT, description TEXT, lines TEXT);

INSERT OR IGNORE INTO client_entries (client_id, entity_name, entity_type, status, company_meta) VALUES ('ENT-001', 'Kedai Runcit Sabah Maju', 'ENTERPRISE', 'Active', '{"name": "Kedai Runcit Sabah Maju", "revenue": 50000}');
INSERT OR IGNORE INTO client_entries (client_id, entity_name, entity_type, status, company_meta) VALUES ('ENT-002', 'Warung Kopi KK', 'ENTERPRISE', 'Active', '{"name": "Warung Kopi KK", "revenue": 15000}');
INSERT OR IGNORE INTO client_entries (client_id, entity_name, entity_type, status, company_meta) VALUES ('ENT-003', 'Buyuk Enterprise', 'ENTERPRISE', 'Active', '{"name": "Buyuk Enterprise", "revenue": 120000}');
INSERT OR IGNORE INTO client_entries (client_id, entity_name, entity_type, status, company_meta) VALUES ('ENT-004', 'Jujur Enterprise', 'ENTERPRISE', 'Active', '{"name": "Jujur Enterprise", "revenue": 75000}');
INSERT OR IGNORE INTO client_entries (client_id, entity_name, entity_type, status, company_meta) VALUES ('ENT-005', 'Lawa Enterprise', 'ENTERPRISE', 'Active', '{"name": "Lawa Enterprise", "revenue": 200000}');
INSERT OR IGNORE INTO client_entries (client_id, entity_name, entity_type, status, company_meta) VALUES ('ENT-006', 'Bida Enterprise', 'ENTERPRISE', 'Active', '{"name": "Bida Enterprise", "revenue": 45000}');
