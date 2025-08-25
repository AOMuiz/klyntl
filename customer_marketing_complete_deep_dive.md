# Customer & Marketing Module - Complete Deep Technical Implementation

## Continuation of Online Store Builder Implementation

```typescript
const renderShippingStep = () => (
  <Card title="Shipping & Delivery" style={styles.stepCard}>
    <Text style={styles.sectionTitle}>Delivery Options</Text>
    
    <DeliveryMethodSelector
      availableMethods={[
        {
          id: 'pickup',
          name: 'Customer Pickup',
          description: 'Customers collect from your location',
          cost: 0,
          icon: 'map-pin',
          supported: true,
          popular: true
        },
        {
          id: 'local_delivery',
          name: 'Local Delivery',
          description: 'Within your city/area',
          cost: 'variable',
          icon: 'truck',
          supported: true,
          coverage: 'local'
        },
        {
          id: 'gig_logistics',
          name: 'GIG Logistics',
          description: 'Nationwide delivery',
          cost: 'calculated',
          logo: gigLogisticsLogo,
          supported: true,
          coverage: 'nationwide'
        },
        {
          id: 'jumia_logistics',
          name: 'Jumia Logistics',
          description: 'Express delivery service',
          cost: 'calculated',
          logo: jumiaLogisticsLogo,
          supported: true,
          coverage: 'major_cities'
        },
        {
          id: 'dhl_nigeria',
          name: 'DHL Nigeria',
          description: 'Premium delivery service',
          cost: 'premium',
          logo: dhlLogo,
          supported: true,
          coverage: 'nationwide'
        }
      ]}
      selectedMethods={store.deliveryMethods}
      onMethodsChange={(methods) =>
        setStore(prev => ({
          ...prev,
          deliveryMethods: methods
        }))
      }
    />
    
    <NigerianZoneConfiguration
      zones={[
        { name: 'Lagos Mainland', states: ['Lagos'], cost: 1500 },
        { name: 'Lagos Island', states: ['Lagos'], cost: 2000 },
        { name: 'Southwest Zone', states: ['Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti'], cost: 2500 },
        { name: 'Southeast Zone', states: ['Anambra', 'Imo', 'Abia', 'Enugu', 'Ebonyi'], cost: 3000 },
        { name: 'North Central', states: ['Abuja', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Plateau', 'Benue'], cost: 3500 },
        { name: 'Northeast Zone', states: ['Adamawa', 'Bauchi', 'Borno', 'Gombe', 'Taraba', 'Yobe'], cost: 4000 },
        { name: 'Northwest Zone', states: ['Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara', 'Jigawa'], cost: 4000 },
        { name: 'South-South Zone', states: ['Rivers', 'Bayelsa', 'Cross River', 'Delta', 'Edo', 'Akwa Ibom'], cost: 3500 }
      ]}
      onZoneConfigChange={handleZoneConfigChange}
    />
    
    <DeliveryTimeEstimator
      businessLocation={store.businessInfo.address}
      deliveryMethods={store.deliveryMethods}
      onTimeEstimatesChange={handleTimeEstimatesChange}
    />
  </Card>
);

const renderPreviewLaunchStep = () => (
  <Card title="Preview & Launch" style={styles.stepCard}>
    <View style={styles.previewSection}>
      <Text style={styles.sectionTitle}>Store Preview</Text>
      <DevicePreviewTabs
        store={store}
        devices={['mobile', 'tablet', 'desktop']}
        onPreviewDevice={setPreviewDevice}
      />
      
      <StorePreview
        store={store}
        device={previewDevice}
        interactive={true}
        style={styles.fullPreview}
      />
    </View>
    
    <View style={styles.launchSection}>
      <Text style={styles.sectionTitle}>Launch Checklist</Text>
      <LaunchChecklist
        items={[
          { id: 'business_info', label: 'Business information complete', completed: isBusinessInfoComplete() },
          { id: 'products', label: 'At least 3 products added', completed: store.products.length >= 3 },
          { id: 'payment', label: 'Payment method configured', completed: store.paymentMethods.length > 0 },
          { id: 'delivery', label: 'Delivery options set', completed: store.deliveryMethods.length > 0 },
          { id: 'legal', label: 'Terms and privacy policy', completed: store.legalPages?.length > 0 },
          { id: 'test_order', label: 'Test order completed', completed: store.testOrderCompleted }
        ]}
        onItemAction={handleChecklistAction}
      />
      
      <CustomDomainSetup
        currentDomain={store.customDomain}
        onDomainChange={handleDomainChange}
        suggestions={generateDomainSuggestions(store.businessInfo.name)}
      />
      
      <SocialMediaIntegration
        platforms={['whatsapp', 'instagram', 'facebook', 'twitter']}
        currentIntegrations={store.socialIntegrations}
        onIntegrationChange={handleSocialIntegrationChange}
      />
    </View>
    
    <View style={styles.launchButtons}>
      <Button
        title="Save as Draft"
        onPress={() => saveStoreDraft(store)}
        type="outline"
        style={styles.button}
      />
      
      <Button
        title="Test Store"
        onPress={() => openTestMode(store)}
        type="solid"
        style={styles.button}
      />
      
      <Button
        title="Launch Store"
        onPress={() => publishStore(store)}
        type="solid"
        buttonStyle={styles.primaryButton}
        disabled={!isStoreLaunchReady()}
      />
    </View>
  </Card>
);
```

## Advanced Offline Synchronization System

```typescript
// Sophisticated offline-first architecture
class OfflineDataManager {
  private sqliteDB: SQLiteDatabase;
  private syncQueue: SyncOperation[];
  private conflictResolver: ConflictResolver;
  private networkMonitor: NetworkMonitor;
  
  constructor() {
    this.initializeLocalDatabase();
    this.setupSyncQueue();
    this.initializeConflictResolution();
    this.startNetworkMonitoring();
  }
  
  // Initialize local SQLite database with full schema
  private async initializeLocalDatabase(): Promise<void> {
    this.sqliteDB = await SQLite.openDatabase({
      name: 'CustomerMarketingDB',
      location: 'default',
    });
    
    // Create tables with Nigerian market optimizations
    await this.sqliteDB.executeSql(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        customer_code TEXT UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT,
        display_name TEXT NOT NULL,
        primary_phone TEXT NOT NULL,
        whatsapp_number TEXT,
        email TEXT,
        address_json TEXT, -- Serialized address object
        customer_type TEXT DEFAULT 'individual',
        total_spent REAL DEFAULT 0,
        total_transactions INTEGER DEFAULT 0,
        last_purchase_date TEXT,
        loyalty_points INTEGER DEFAULT 0,
        current_tier TEXT DEFAULT 'bronze',
        preferences_json TEXT, -- Serialized preferences
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'synced', -- synced, pending, conflict
        last_synced_at TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(primary_phone);
      CREATE INDEX IF NOT EXISTS idx_customers_sync ON customers(sync_status);
      CREATE INDEX IF NOT EXISTS idx_customers_updated ON customers(updated_at);
    `);
    
    await this.sqliteDB.executeSql(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        transaction_number TEXT UNIQUE,
        transaction_type TEXT NOT NULL,
        gross_amount REAL NOT NULL,
        net_amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_status TEXT DEFAULT 'completed',
        items_json TEXT, -- Serialized items array
        transaction_date TEXT DEFAULT CURRENT_TIMESTAMP,
        location_id TEXT,
        notes TEXT,
        sync_status TEXT DEFAULT 'synced',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_transactions_customer ON transactions(customer_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_sync ON transactions(sync_status);
    `);
    
    await this.sqliteDB.executeSql(`
      CREATE TABLE IF NOT EXISTS communications (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        communication_type TEXT NOT NULL,
        message_content TEXT,
        delivery_status TEXT DEFAULT 'pending',
        sent_at TEXT,
        campaign_id TEXT,
        sync_status TEXT DEFAULT 'synced',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers (id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_communications_customer ON communications(customer_id);
      CREATE INDEX IF NOT EXISTS idx_communications_status ON communications(delivery_status);
    `);
    
    await this.sqliteDB.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_type TEXT NOT NULL, -- create, update, delete
        table_name TEXT NOT NULL,
        record_id TEXT NOT NULL,
        data_json TEXT, -- Serialized data
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 5,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        scheduled_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_sync_queue_scheduled ON sync_queue(scheduled_at);
    `);
  }
  
  // Queue operations for background sync
  async queueSyncOperation(operation: SyncOperation): Promise<void> {
    await this.sqliteDB.executeSql(`
      INSERT INTO sync_queue (operation_type, table_name, record_id, data_json)
      VALUES (?, ?, ?, ?)
    `, [
      operation.type,
      operation.tableName,
      operation.recordId,
      JSON.stringify(operation.data)
    ]);
    
    // Trigger immediate sync if online
    if (this.networkMonitor.isOnline()) {
      this.processSyncQueue();
    }
  }
  
  // Process sync queue with retry logic
  private async processSyncQueue(): Promise<void> {
    const [results] = await this.sqliteDB.executeSql(`
      SELECT * FROM sync_queue 
      WHERE retry_count < max_retries 
      AND datetime(scheduled_at) <= datetime('now')
      ORDER BY created_at ASC
      LIMIT 50
    `);
    
    for (let i = 0; i < results.rows.length; i++) {
      const queueItem = results.rows.item(i);
      
      try {
        const success = await this.executeSyncOperation({
          type: queueItem.operation_type,
          tableName: queueItem.table_name,
          recordId: queueItem.record_id,
          data: JSON.parse(queueItem.data_json)
        });
        
        if (success) {
          // Remove from queue
          await this.sqliteDB.executeSql(`
            DELETE FROM sync_queue WHERE id = ?
          `, [queueItem.id]);
          
          // Update local record sync status
          await this.updateLocalSyncStatus(
            queueItem.table_name,
            queueItem.record_id,
            'synced'
          );
        } else {
          // Increment retry count with exponential backoff
          const nextRetry = new Date();
          nextRetry.setMinutes(nextRetry.getMinutes() + Math.pow(2, queueItem.retry_count));
          
          await this.sqliteDB.executeSql(`
            UPDATE sync_queue 
            SET retry_count = retry_count + 1,
                scheduled_at = ?
            WHERE id = ?
          `, [nextRetry.toISOString(), queueItem.id]);
        }
      } catch (error) {
        console.error('Sync operation failed:', error);
        
        // Mark as failed if max retries exceeded
        if (queueItem.retry_count >= queueItem.max_retries - 1) {
          await this.handleSyncFailure(queueItem);
        }
      }
    }
  }
  
  // Execute individual sync operations
  private async executeSyncOperation(operation: SyncOperation): Promise<boolean> {
    const endpoint = this.getApiEndpoint(operation.tableName, operation.type);
    const method = this.getHttpMethod(operation.type);
    
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
          'X-Device-ID': await this.getDeviceId(),
          'X-Sync-Version': '1.0'
        },
        body: operation.type !== 'delete' ? JSON.stringify(operation.data) : undefined
      });
      
      if (response.ok) {
        const serverData = await response.json();
        
        // Handle server response and potential conflicts
        await this.handleSyncResponse(operation, serverData);
        return true;
      } else if (response.status === 409) {
        // Conflict detected
        const conflictData = await response.json();
        await this.handleSyncConflict(operation, conflictData);
        return false; // Will retry after conflict resolution
      } else {
        console.error('Sync failed:', response.status, response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Network error during sync:', error);
      return false;
    }
  }
  
  // Intelligent conflict resolution
  private async handleSyncConflict(
    localOperation: SyncOperation,
    serverData: any
  ): Promise<void> {
    const resolution = await this.conflictResolver.resolve(localOperation, serverData);
    
    switch (resolution.strategy) {
      case 'use_server':
        // Accept server version
        await this.updateLocalRecord(
          localOperation.tableName,
          localOperation.recordId,
          serverData
        );
        break;
        
      case 'use_local':
        // Force push local version
        await this.forceSyncOperation(localOperation);
        break;
        
      case 'merge':
        // Merge changes
        const mergedData = await this.conflictResolver.merge(
          localOperation.data,
          serverData
        );
        await this.updateLocalRecord(
          localOperation.tableName,
          localOperation.recordId,
          mergedData
        );
        await this.queueSyncOperation({
          ...localOperation,
          data: mergedData
        });
        break;
        
      case 'manual':
        // Require user intervention
        await this.flagForManualResolution(localOperation, serverData);
        break;
    }
  }
  
  // Smart conflict resolution based on data type and user preferences
  class ConflictResolver {
    async resolve(localOperation: SyncOperation, serverData: any): Promise<ConflictResolution> {
      const tableName = localOperation.tableName;
      const localData = localOperation.data;
      
      // Different strategies for different data types
      switch (tableName) {
        case 'customers':
          return await this.resolveCustomerConflict(localData, serverData);
          
        case 'transactions':
          return await this.resolveTransactionConflict(localData, serverData);
          
        case 'communications':
          return await this.resolveCommunicationConflict(localData, serverData);
          
        default:
          return { strategy: 'manual' };
      }
    }
    
    private async resolveCustomerConflict(
      localData: any,
      serverData: any
    ): Promise<ConflictResolution> {
      // Financial data (transactions, spending) - server wins (more authoritative)
      if (localData.total_spent !== serverData.total_spent ||
          localData.total_transactions !== serverData.total_transactions) {
        return { strategy: 'use_server' };
      }
      
      // Contact information - most recent wins
      const localUpdated = new Date(localData.updated_at);
      const serverUpdated = new Date(serverData.updated_at);
      
      if (this.hasContactChanges(localData, serverData)) {
        return {
          strategy: localUpdated > serverUpdated ? 'use_local' : 'use_server'
        };
      }
      
      // Preferences and notes - merge
      if (this.hasPreferenceChanges(localData, serverData)) {
        return { strategy: 'merge' };
      }
      
      return { strategy: 'use_server' }; // Default to server
    }
    
    private async resolveTransactionConflict(
      localData: any,
      serverData: any
    ): Promise<ConflictResolution> {
      // Transactions are immutable once created
      // If amounts differ, require manual resolution
      if (localData.net_amount !== serverData.net_amount) {
        return { strategy: 'manual' };
      }
      
      // Status updates and notes can be merged
      return { strategy: 'merge' };
    }
    
    async merge(localData: any, serverData: any): Promise<any> {
      const merged = { ...serverData }; // Start with server data
      
      // Merge contact preferences (local user knows best)
      if (localData.preferences_json && serverData.preferences_json) {
        const localPrefs = JSON.parse(localData.preferences_json);
        const serverPrefs = JSON.parse(serverData.preferences_json);
        
        merged.preferences_json = JSON.stringify({
          ...serverPrefs,
          ...localPrefs, // Local preferences take precedence
          lastUpdated: new Date().toISOString()
        });
      }
      
      // Merge notes (append local notes to server notes)
      if (localData.notes && serverData.notes && localData.notes !== serverData.notes) {
        merged.notes = `${serverData.notes}\n\n[Local update: ${new Date().toLocaleString()}]\n${localData.notes}`;
      }
      
      return merged;
    }
  }
}

// Real-time data synchronization
class RealtimeSync {
  private websocket: WebSocket;
  private subscriptions: Map<string, SubscriptionCallback>;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  
  constructor(private businessId: string) {
    this.subscriptions = new Map();
    this.connect();
  }
  
  private connect(): void {
    const wsUrl = `wss://api.yourbusiness.com/ws/${this.businessId}?token=${this.getAuthToken()}`;
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('Real-time sync connected');
      this.reconnectAttempts = 0;
      
      // Subscribe to all active subscriptions
      this.subscriptions.forEach((callback, channel) => {
        this.subscribe(channel, callback);
      });
    };
    
    this.websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleRealtimeMessage(message);
    };
    
    this.websocket.onclose = () => {
      console.log('Real-time sync disconnected');
      this.attemptReconnect();
    };
    
    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }
  
  private handleRealtimeMessage(message: RealtimeMessage): void {
    const { channel, type, data } = message;
    
    switch (type) {
      case 'customer_updated':
        this.handleCustomerUpdate(data);
        break;
        
      case 'transaction_created':
        this.handleNewTransaction(data);
        break;
        
      case 'campaign_delivered':
        this.handleCampaignDelivery(data);
        break;
        
      case 'loyalty_points_earned':
        this.handleLoyaltyUpdate(data);
        break;
    }
    
    // Notify subscribers
    const callback = this.subscriptions.get(channel);
    if (callback) {
      callback(type, data);
    }
  }
  
  private async handleCustomerUpdate(customerData: any): Promise<void> {
    // Update local database
    await this.offlineDataManager.updateLocalRecord('customers', customerData.id, customerData);
    
    // Notify UI components
    this.notifyUIUpdate('customer', customerData);
  }
  
  subscribe(channel: string, callback: SubscriptionCallback): void {
    this.subscriptions.set(channel, callback);
    
    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        action: 'subscribe',
        channel: channel
      }));
    }
  }
  
  unsubscribe(channel: string): void {
    this.subscriptions.delete(channel);
    
    if (this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({
        action: 'unsubscribe',
        channel: channel
      }));
    }
  }
}
```

## Performance Optimization for Nigerian Networks

```typescript
// Network-aware data loading and caching
class NetworkOptimizedDataLoader {
  private connectionQuality: ConnectionQuality;
  private dataCache: Map<string, CachedData>;
  private compressionEnabled: boolean = true;
  
  constructor() {
    this.connectionQuality = this.detectConnectionQuality();
    this.dataCache = new Map();
    this.setupNetworkOptimizations();
  }
  
  // Detect Nigerian network conditions
  private detectConnectionQuality(): ConnectionQuality {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) {
      return 'unknown';
    }
    
    // Map Nigerian network types to quality levels
    const qualityMapping: Record<string, ConnectionQuality> = {
      '4g': 'high',
      '3g': 'medium',
      '2g': 'low',
      'wifi': 'high',
      'cellular': 'medium',
      'ethernet': 'high'
    };
    
    return qualityMapping[connection.effectiveType] || 'medium';
  }
  
  // Load data with network-aware strategies
  async loadCustomers(params: CustomerLoadParams): Promise<Customer[]> {
    const cacheKey = `customers_${JSON.stringify(params)}`;
    const cached = this.dataCache.get(cacheKey);
    
    // Use cached data for low-quality connections
    if (cached && !this.shouldRefreshCache(cached, this.connectionQuality)) {
      return cached.data;
    }
    
    // Adjust request strategy based on network quality
    const loadStrategy = this.getLoadStrategy(this.connectionQuality);
    
    switch (loadStrategy) {
      case 'minimal':
        return await this.loadMinimalCustomerData(params);
        
      case 'progressive':
        return await this.loadCustomersProgressively(params);
        
      case 'full':
        return await this.loadFullCustomerData(params);
        
      default:
        return await this.loadCustomersProgressively(params);
    }
  }
  
  // Minimal data loading for poor connections
  private async loadMinimalCustomerData(params: CustomerLoadParams): Promise<Customer[]> {
    const minimalFields = [
      'id', 'display_name', 'primary_phone', 'total_spent', 
      'last_purchase_date', 'customer_type'
    ];
    
    const response = await this.makeOptimizedRequest('/customers', {
      ...params,
      fields: minimalFields.join(','),
      compress: true,
      timeout: 15000 // Longer timeout for poor connections
    });
    
    return response.data;
  }
  
  // Progressive loading for medium connections
  private async loadCustomersProgressively(params: CustomerLoadParams): Promise<Customer[]> {
    // Load essential data first
    const essential = await this.loadMinimalCustomerData(params);
    
    // Load additional data in background
    setTimeout(async () => {
      const additional = await this.loadAdditionalCustomerData(essential.map(c => c.id));
      this.mergeCustomerData(essential, additional);
    }, 1000);
    
    return essential;
  }
  
  // Image optimization for Nigerian networks
  class ImageOptimizer {
    static optimizeForNetwork(imageUrl: string, quality: ConnectionQuality): string {
      const baseUrl = 'https://cdn.yourbusiness.com/images';
      const imagePath = imageUrl.replace(baseUrl, '');
      
      const optimizations = {
        low: 'w_150,h_150,q_30,f_webp',      // Very compressed for 2G
        medium: 'w_300,h_300,q_60,f_webp',   // Balanced for 3G
        high: 'w_600,h_600,q_80,f_webp',     // High quality for 4G/WiFi
        unknown: 'w_300,h_300,q_50,f_webp'   // Safe default
      };
      
      const transform = optimizations[quality];
      return `${baseUrl}/c_fill,${transform}${imagePath}`;
    }
    
    // Lazy loading with Nigerian network awareness
    static createLazyLoader(quality: ConnectionQuality): IntersectionObserver {
      const rootMargin = {
        low: '50px',     // Load just before visible for slow connections
        medium: '200px', // Standard lazy loading margin
        high: '500px',   // Aggressive preloading for fast connections
        unknown: '200px'
      };
      
      return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const optimizedSrc = this.optimizeForNetwork(img.dataset.src!, quality);
            img.src = optimizedSrc;
            img.classList.remove('lazy');
          }
        });
      }, {
        rootMargin: rootMargin[quality]
      });
    }
  }
  
  // Data compression for slow networks
  private async makeOptimizedRequest(
    endpoint: string, 
    options: RequestOptions
  ): Promise<ApiResponse> {
    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: options.timeout || 10000
    };
    
    // Enable compression for slow connections
    if (this.connectionQuality === 'low' || options.compress) {
      requestOptions.headers!['Accept-Encoding'] = 'gzip, deflate, br';
    }
    
    // Add request body for POST/PUT
    if (options.body) {
      requestOptions.body = JSON.stringify(options.body);
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...requestOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache successful responses
      if (options.cacheable !== false) {
        this.cacheResponse(endpoint, data, options);
      }
      
      return { success: true, data };
    } catch (error) {
      // Return cached data on network failure
      const cachedResponse = this.getCachedResponse(endpoint, options);
      if (cachedResponse) {
        console.warn('Using cached data due to network error:', error);
        return { success: true, data: cachedResponse.data, fromCache: true };
      }
      
      throw error;
    }
  }
}

// Battery-aware background sync
class BatteryAwareSync {
  private batteryManager: any;
  private isLowBattery: boolean = false;
  private syncInterval: number = 30000; // 30 seconds default
  
  constructor() {
    this.initializeBatteryAPI();
    this.adjustSyncStrategy();
  }
  
  private async initializeBatteryAPI(): Promise<void> {
    try {
      this.batteryManager = await (navigator as any).getBattery();
      
      if (this.batteryManager) {
        this.batteryManager.addEventListener('levelchange', () => {
          this.onBatteryLevelChange();
        });
        
        this.batteryManager.addEventListener('chargingchange', () => {
          this.onChargingStatusChange();
        });
        
        this.onBatteryLevelChange(); // Initial check
      }
    } catch (error) {
      console.warn('Battery API not supported');
    }
  }
  
  private onBatteryLevelChange(): void {
    const level = this.batteryManager.level;
    const wasLowBattery = this.isLowBattery;
    this.isLowBattery = level < 0.2; // Below 20%
    
    if (this.isLowBattery !== wasLowBattery) {
      this.adjustSyncStrategy();
    }
  }
  
  private onChargingStatusChange(): void {
    const isCharging = this.batteryManager.charging;
    
    if (isCharging && this.isLowBattery) {
      // Resume normal sync when charging
      this.adjustSyncStrategy();
    }
  }
  
  private adjustSyncStrategy(): void {
    if (this.isLowBattery && !this.batteryManager?.charging) {
      // Reduce sync frequency for low battery
      this.syncInterval = 300000; // 5 minutes
      console.log('Reduced sync frequency due to low battery');
    } else {
      // Normal sync frequency
      this.syncInterval = 30000; // 30 seconds
    }
    
    // Restart sync timer with new interval
    this.restartSyncTimer();
  }
  
  private restartSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      this.performBackgroundSync();
    }, this.syncInterval);
  }
  
  private async performBackgroundSync(): Promise<void> {
    // Skip sync if battery is critically low
    if (this.batteryManager?.level < 0.05) {
      console.log('Skipping sync due to critically low battery');
      return;
    }
    
    try {
      await this.offlineDataManager.processSyncQueue();
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }
}
```

## Advanced Security Implementation

```typescript
// Comprehensive security layer for Nigerian market
class SecurityManager {
  private encryptionKey: CryptoKey;
  private deviceFingerprint: string;
  private securityPolicies: SecurityPolicy[];
  
  constructor() {
    this.initializeSecurity();
    this.setupSecurityPolicies();
  }
  
  private async initializeSecurity(): Promise<void> {
    // Generate device-specific encryption key
    this.encryptionKey = await this.generateEncryptionKey();
    this.deviceFingerprint = await this.generateDeviceFingerprint();
    
    // Initialize secure storage
    await this.initializeSecureStorage();
  }
  
  // Nigerian-specific security policies
  private setupSecurityPolicies(): void {
    this.securityPolicies = [
      {
        name: 'Nigerian Data Protection Regulation (NDPR) Compliance',
        rules: [
          'Encrypt all PII data at rest and in transit',
          'Require explicit consent for marketing communications',
          'Implement data retention policies (7 years for financial records)',
          'Provide data portability and deletion rights'
        ]
      },
      {
        name: 'Financial Data Security',
        rules: [
          'Use PCI DSS compliant payment processing',
          'Encrypt transaction data with AES-256',
          'Implement fraud detection for Nigerian payment patterns',
          'Log all financial operations for audit trails'
        ]
      },
      {
        name: 'Device Security',
        rules: [
          'Implement biometric authentication where available',
          'Use certificate pinning for API communications',
          'Detect and prevent app tampering',
          'Implement secure session management'
        ]
      }
    ];
  }
  
  // Secure customer data encryption
  async encryptCustomerData(customerData: any): Promise<EncryptedData> {
    const sensitiveFields = [
      'primaryPhone', 'secondaryPhone', 'whatsappNumber', 'email',
      'address', 'dateOfBirth', 'businessRegistrationNumber', 'taxId'
    ];
    
    const encryptedData = { ...customerData };
    
    for (const field of sensitiveFields) {
      if (encryptedData[field]) {
        encryptedData[field] = await this.encryptField(encryptedData[field]);
      }
    }
    
    return {
      ...encryptedData,
      _encrypted: true,
      _encryptionVersion: '1.0'
    };
  }
  
  async decryptCustomerData(encryptedData: EncryptedData): Promise<any> {
    if (!encryptedData._encrypted) {
      return encryptedData;
    }
    
    const decryptedData = { ...encryptedData };
    delete decryptedData._encrypted;
    delete decryptedData._encryptionVersion;
    
    const sensitiveFields = [
      'primaryPhone', 'secondaryPhone', 'whatsappNumber', 'email',
      'address', 'dateOfBirth', 'businessRegistrationNumber', 'taxId'
    ];
    
    for (const field of sensitiveFields) {
      if (decryptedData[field] && typeof decryptedData[field] === 'object') {
        decryptedData[field] = await this.decryptField(decryptedData[field]);
      }
    }
    
    return decryptedData;
  }
  
  private async encryptField(value: string): Promise<EncryptedField> {
    const encoder = new TextEncoder();
    const data = encoder.encode(value);
    
    // Generate random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      data
    );
    
    return {
      data: Array.from(new Uint8Array(encryptedData)),
      iv: Array.from(iv),
      algorithm: 'AES-GCM'
    };
  }
  
  private async decryptField(encryptedField: EncryptedField): Promise<string> {
    const data = new Uint8Array(encryptedField.data);
    const iv = new Uint8Array(encryptedField.iv);
    
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      data
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }
  
  // Nigerian phone number validation and formatting
  validateNigerianPhone(phone: string): ValidationResult {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Nigerian phone number patterns
    const patterns = [
      /^234[789][01]\d{8}$/,     // International format: +234XXXXXXXXX
      /^0[789][01]\d{8}$/,       // Local format: 0XXXXXXXXXX
      /^[789][01]\d{8}$/         // Without country code: XXXXXXXXXX
    ];
    
    const isValid = patterns.some(pattern => pattern.test(cleaned));
    
    if (!isValid) {
      return {
        isValid: false,
        error: 'Invalid Nigerian phone number format',
        suggestion: 'Use format: +234XXXXXXXXX or 0XXXXXXXXXX'
      };
    }
    
    // Format to standard international format
    let formatted: string;
    if (cleaned.startsWith('234')) {
      formatted = `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      formatted = `+234${cleaned.substring(1)}`;
    } else if (cleaned.length === 10) {
      formatted = `+234${cleaned}`;
    } else {
      formatted = phone; // Fallback
    }
    
    // Detect network provider
    const network = this.detectNigerianNetwork(formatted);
    
    return {
      isValid: true,
      formatted,
      network,
      suggestion: null
    };
  }
  
  private detectNigerianNetwork(phone: string): string {
    const number = phone.replace(/\D/g, '');
    const prefix = number.substring(3, 6); // Get network prefix
    
    const networkMap: Record<string, string> = {
      // MTN prefixes
      '803': 'MTN', '806': 'MTN', '813': 'MTN', '814': 'MTN',
      '816': 'MTN', '903': 'MTN', '906': 'MTN', '913': 'MTN',
      
      // Airtel prefixes
      '802': 'Airtel', '808': 'Airtel', '812': 'Airtel', '901': 'Airtel',
      '902': 'Airtel', '904': 'Airtel', '907': 'Airtel', '912': 'Airtel',
      
      // Glo prefixes
      '805': 'Glo', '807': 'Glo', '811': 'Glo', '815': 'Glo', '905': 'Glo',
      
      // 9mobile prefixes
      '809': '9mobile', '817': '9mobile', '818': '9mobile', '908': '9mobile', '909': '9mobile'
    };
    
    return networkMap[prefix] || 'Unknown';
  }
  
  // Fraud detection for Nigerian market
  async detectFraudulentActivity(transaction: Transaction, customer: Customer): Promise<FraudAssessment> {
    const riskFactors: RiskFactor[] = [];
    let riskScore = 0;
    
    // Check transaction amount patterns
    if (transaction.amount > customer.analytics.averageOrderValue * 5) {
      riskFactors.push({
        type: 'unusual_amount',
        description: 'Transaction amount significantly higher than customer average',
        weight: 0.3
      });
      riskScore += 30;
    }
    
    // Check geographic patterns
    if (transaction.location && customer.address) {
      const distance = this.calculateDistance(
        transaction.location,
        customer.address
      );
      
      if (distance > 500) { // More than 500km from usual location
        riskFactors.push({
          type: 'unusual_location',
          description: 'Transaction far from customer usual location',
          weight: 0.4
        });
        riskScore += 40;
      }
    }
    
    // Check time patterns (Nigerian business hours)
    const transactionHour = new Date(transaction.timestamp).getHours();
    if (transactionHour < 6 || transactionHour > 22) {
      riskFactors.push({
        type: 'unusual_time',
        description: 'Transaction outside typical business hours',
        weight: 0.2
      });
      riskScore += 20;
    }
    
    // Check payment method risks
    if (transaction.paymentMethod === 'new_card' && transaction.amount > 50000) {
      riskFactors.push({
        type: 'new_payment_method',
        description: 'High-value transaction with new payment method',
        weight: 0.3
      });
      riskScore += 30;
    }
    
    // Nigerian-specific risk factors
    const nigerianRiskFactors = await this.checkNigerianSpecificRisks(transaction, customer);
    riskFactors.push(...nigerianRiskFactors.factors);
    riskScore += nigerianRiskFactors.score;
    
    return {
      riskScore: Math.min(riskScore, 100),
      riskLevel: this.calculateRiskLevel(riskScore),
      riskFactors,
      recommendedAction: this.getRecommendedAction(riskScore),
      requiresManualReview: riskScore > 70
    };
  }
  
  private async checkNigerianSpecificRisks(
    transaction: Transaction, 
    customer: Customer
  ): Promise<{ factors: RiskFactor[], score: number }> {
    const factors: RiskFactor[] = [];
    let score = 0;
    
    // Check against known fraud patterns in Nigeria
    const fraudPatterns = await this.getNigerianFraudPatterns();
    
    // Check phone number changes
    if (customer.phoneChangeHistory?.length > 3) {
      factors.push({
        type: 'frequent_phone_changes',
        description: 'Customer has changed phone number frequently',
        weight: 0.25
      });
      score += 25;
    }
    
    // Check payment method diversity (common fraud indicator)
    const uniquePaymentMethods = new Set(
      customer.transactionHistory?.map(t => t.paymentMethod) || []
    );
    
    if (uniquePaymentMethods.size > 5) {
      factors.push({
        type: 'multiple_payment_methods',
        description: 'Customer uses many different payment methods',
        weight: 0.2
      });
      score += 20;
    }
    
    return { factors, score };
  }
}
```

## Production Deployment Configuration

```typescript
// Production-ready deployment setup
class ProductionDeployment {
  private infrastructure: InfrastructureConfig;
  private monitoring: MonitoringConfig;
  private scaling: AutoScalingConfig;
  
  constructor() {
    this.setupInfrastructure();
    this.configureMonitoring();
    this.setupAutoScaling();
  }
  
  // AWS infrastructure optimized for Nigerian market
  private setupInfrastructure(): void {
    this.infrastructure = {
      regions: {
        primary: 'eu-west-1', // Ireland (closest to Nigeria with good connectivity)
        secondary: 'us-east-1', // Backup region
        cdn: 'global' // CloudFront for global CDN
      },
      
      compute: {
        apiServer: {
          instance: 't3.large', // 2 vCPU, 8GB RAM
          autoScaling: {
            min: 2,
            max: 10,
            targetCPU: 70
          }
        },
        
        workers: {
          instance: 't3.medium', // For background jobs
          autoScaling: {
            min: 1,
            max: 5,
            targetCPU: 80
          }
        }
      },
      
      database: {
        primary: {
          engine: 'PostgreSQL 14',
          instance: 'db.t3.large',
          storage: '100GB SSD',
          multiAZ: true,
          backupRetention: 30 // days
        },
        
        cache: {
          engine: 'Redis 6.2',
          instance: 'cache.t3.medium',
          clustering: true
        }
      },
      
      storage: {
        files: 'S3 Standard',
        backups: 'S3 Glacier',
        cdn: 'CloudFront'
      },
      
      networking: {
        vpc: 'Custom VPC with public/private subnets',
        loadBalancer: 'Application Load Balancer',
        ssl: 'AWS Certificate Manager'
      }
    };
  }
  
  // Comprehensive monitoring for Nigerian operations
  private configureMonitoring(): void {
    this.monitoring = {
      applicationMetrics: [
        'api_response_time',
        'database_query_time',
        'cache_hit_rate',
        'error_rate',
        'user_active_sessions',
        'transaction_processing_time',
        'sms_delivery_rate',
        'whatsapp_delivery_rate'
      ],
      
      businessMetrics: [
        'daily_active_users',
        'transaction_volume',
        'customer_acquisition_rate',
        'revenue_per_user',
        'churn_rate',
        'campaign_effectiveness'
      ],
      
      alerts: [
        {
          metric: 'api_response_time',
          threshold: '2s',
          severity: 'warning'
        },
        {
          metric: 'error_rate',
          threshold: '5%',
          severity: 'critical'
        },
        {
          metric: 'database_connection_pool',
          threshold: '80%',
          severity: 'warning'
        }
      ],
      
      dashboards: [
        'System Health Overview',
        'Business KPIs',
        'Nigerian Market Metrics',
        'Customer Engagement Analytics'
      ]
    };
  }
  
  // Environment-specific configurations
  getEnvironmentConfig(env: 'development' | 'staging' | 'production'): EnvironmentConfig {
    const baseConfig = {
      database: {
        host: process.env.DB_HOST,
        port: 5432,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: env === 'production'
      },
      
      redis: {
        host: process.env.REDIS_HOST,
        port: 6379,
        password: process.env.REDIS_PASSWORD
      },
      
      jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: env === 'production' ? '1h' : '24h'
      }
    };
    
    const environmentConfigs = {
      development: {
        ...baseConfig,
        logLevel: 'debug',
        cors: { origin: 'http://localhost:3000' },
        rateLimit: { windowMs: 15 * 60 * 1000, max: 1000 }
      },
      
      staging: {
        ...baseConfig,
        logLevel: 'info',
        cors: { origin: 'https://staging.yourbusiness.com' },
        rateLimit: { windowMs: 15 * 60 * 1000, max: 500 }
      },
      
      production: {
        ...baseConfig,
        logLevel: 'warn',
        cors: { origin: 'https://yourbusiness.com' },
        rateLimit: { windowMs: 15 * 60 * 1000, max: 100 }
      }
    };
    
    return environmentConfigs[env];
  }
  
  // Docker configuration for containerized deployment
  generateDockerfile(): string {
    return `
# Multi-stage build for optimal production image
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN yarn build

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node healthcheck.js

# Start application
CMD ["node", "dist/server.js"]
    `;
  }
  
  // Kubernetes deployment manifests
  generateK8sManifests(): Record<string, any> {
    return {
      deployment: {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name: 'customer-marketing-api',
          labels: { app: 'customer-marketing-api' }
        },
        spec: {
          replicas: 3,
          selector: {
            matchLabels: { app: 'customer-marketing-api' }
          },
          template: {
            metadata: {
              labels: { app: 'customer-marketing-api' }
            },
            spec: {
              containers: [{
                name: 'api',
                image: 'customer-marketing-api:latest',
                ports: [{ containerPort: 3000 }],
                resources: {
                  requests: { memory: '256Mi', cpu: '250m' },
                  limits: { memory: '512Mi', cpu: '500m' }
                },
                env: [
                  { name: 'NODE_ENV', value: 'production' },
                  { name: 'DB_HOST', valueFrom: { secretKeyRef: { name: 'db-secret', key: 'host' } } }
                ],
                livenessProbe: {
                  httpGet: { path: '/health', port: 3000 },
                  initialDelaySeconds: 30,
                  periodSeconds: 10
                },
                readinessProbe: {
                  httpGet: { path: '/ready', port: 3000 },
                  initialDelaySeconds: 5,
                  periodSeconds: 5
                }
              }]
            }
          }
        }
      },
      
      service: {
        apiVersion: 'v1',
        kind: 'Service',
        metadata: {
          name: 'customer-marketing-service'
        },
        spec: {
          selector: { app: 'customer-marketing-api' },
          ports: [{ port: 80, targetPort: 3000 }],
          type: 'LoadBalancer'
        }
      },
      
      hpa: {
        apiVersion: 'autoscaling/v2',
        kind: 'HorizontalPodAutoscaler',
        metadata: {
          name: 'customer-marketing-hpa'
        },
        spec: {
          scaleTargetRef: {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: 'customer-marketing-api'
          },
          minReplicas: 2,
          maxReplicas: 10,
          metrics: [
            {
              type: 'Resource',
              resource: {
                name: 'cpu',
                target: { type: 'Utilization', averageUtilization: 70 }
              }
            },
            {
              type: 'Resource',
              resource: {
                name: 'memory',
                target: { type: 'Utilization', averageUtilization: 80 }
              }
            }
          ]
        }
      }
    };
  }
}
```

## Testing Strategy

```typescript
// Comprehensive testing approach
describe('Customer Management System', () => {
  describe('Nigerian Phone Validation', () => {
    it('should validate MTN numbers correctly', () => {
      const validator = new SecurityManager();
      const result = validator.validateNigerianPhone('+2348031234567');
      
      expect(result.isValid).toBe(true);
      expect(result.network).toBe('MTN');
      expect(result.formatted).toBe('+2348031234567');
    });
    
    it('should format local numbers to international', () => {
      const validator = new SecurityManager();
      const result = validator.validateNigerianPhone('08031234567');
      
      expect(result.formatted).toBe('+2348031234567');
    });
    
    it('should reject invalid numbers', () => {
      const validator = new SecurityManager();
      const result = validator.validateNigerianPhone('1234567890');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('Offline Synchronization', () => {
    it('should queue operations when offline', async () => {
      const offlineManager = new OfflineDataManager();
      
      // Mock offline state
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      
      await offlineManager.createCustomer({
        firstName: 'Test',
        lastName: 'Customer',
        primaryPhone: '+2348031234567'
      });
      
      const queueSize = await offlineManager.getSyncQueueSize();
      expect(queueSize).toBeGreaterThan(0);
    });
    
    it('should resolve conflicts intelligently', async () => {
      const resolver = new ConflictResolver();
      
      const localData = {
        firstName: 'John',
        lastName: 'Doe',
        totalSpent: 50000,
        updatedAt: '2024-01-15T10:00:00Z'
      };
      
      const serverData = {
        firstName: 'John',
        lastName: 'Doe',
        totalSpent: 75000, // Server has more recent financial data
        updatedAt: '2024-01-14T15:00:00Z'
      };
      
      const resolution = await resolver.resolveCustomerConflict(localData, serverData);
      expect(resolution.strategy).toBe('use_server'); // Financial data prioritized
    });
  });
  
  describe('Performance Under Nigerian Network Conditions', () => {
    it('should load minimal data on 2G connection', async () => {
      const loader = new NetworkOptimizedDataLoader();
      
      // Mock 2G connection
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '2g' }
      });
      
      const customers = await loader.loadCustomers({ limit: 50 });
      
      // Should only include essential fields
      customers.forEach(customer => {
        expect(customer).toHaveProperty('id');
        expect(customer).toHaveProperty('displayName');
        expect(customer).toHaveProperty('primaryPhone');
        expect(customer).not.toHaveProperty('detailedAddress'); // Non-essential field
      });
    });
  });
  
  describe('Marketing Campaign Performance', () => {
    it('should calculate accurate delivery rates for Nigerian networks', async () => {
      const campaignEngine = new MarketingCampaignEngine();
      
      const campaign = await campaignEngine.executeCampaign({
        type: 'promotional',
        targetSegment: 'high_value_customers',
        messageTemplate: 'Thank you for being a valued customer!'
      });
      
      expect(campaign.results.deliveryRate).toBeGreaterThan(0.85); // 85% minimum
      expect(campaign.results.networkBreakdown).toHaveProperty('MTN');
      expect(campaign.results.networkBreakdown).toHaveProperty('Airtel');
    });
  });
});

// Load testing for Nigerian market conditions
describe('Load Testing', () => {
  it('should handle peak Nigerian business hours traffic', async () => {
    const loadTest = new LoadTester({
      targetRPS: 1000, // 1000 requests per second
      duration: 300, // 5 minutes
      userScenarios: [
        { weight: 40, scenario: 'view_customers' },
        { weight: 30, scenario: 'add_transaction' },
        { weight: 20, scenario: 'send_message' },
        { weight: 10, scenario: 'generate_report' }
      ]
    });
    
    const results = await loadTest.execute();
    
    expect(results.averageResponseTime).toBeLessThan(2000); // 2 seconds
    expect(results.errorRate).toBeLessThan(0.01); // Less than 1%
    expect(results.throughput).toBeGreaterThan(800); // RPS
  });
});
```

## Performance Benchmarks and SLAs

```typescript
// Service Level Agreements for Nigerian Market
const SLA_TARGETS = {
  // API Performance
  api: {
    responseTime: {
      p50: 500,  // 50th percentile: 500ms
      p95: 2000, // 95th percentile: 2s
      p99: 5000  // 99th percentile: 5s
    },
    availability: 99.9, // 99.9% uptime
    throughput: 1000    // Requests per second
  },
  
  // Database Performance
  database: {
    queryTime: {
      simple: 100,    // Simple queries: 100ms
      complex: 1000,  // Complex reports: 1s
      analytics: 5000 // Heavy analytics: 5s
    },
    availability: 99.95
  },
  
  // Nigerian Network Considerations
  network: {
    '2g': {
      maxPayloadSize: '50KB',
      timeout: 30000, // 30 seconds
      retries: 3
    },
    '3g': {
      maxPayloadSize: '200KB',
      timeout: 15000, // 15 seconds
      retries: 2
    },
    '4g': {
      maxPayloadSize: '1MB',
      timeout: 10000, // 10 seconds
      retries: 1
    }
  },
  
  // Communication Services
  messaging: {
    sms: {
      deliveryRate: 95,   // 95% delivery rate
      deliveryTime: 60,   // 1 minute average
      costPerSMS: 12      // ₦12 per SMS
    },
    whatsapp: {
      deliveryRate: 98,   // 98% delivery rate
      deliveryTime: 30,   // 30 seconds average
      costPerMessage: 15  // ₦15 per message
    },
    email: {
      deliveryRate: 99,   // 99% delivery rate
      deliveryTime: 10,   // 10 seconds average
      bounceRate: 2       // 2% bounce rate
    }
  }
};

// Performance monitoring and alerting
class PerformanceMonitor {
  private metrics: Map<string, MetricCollector>;
  private alerts: AlertManager;
  
  constructor() {
    this.initializeMetrics();
    this.setupAlerts();
  }
  
  private initializeMetrics(): void {
    this.metrics = new Map([
      ['api_response_time', new ResponseTimeCollector()],
      ['database_query_time', new DatabaseMetricsCollector()],
      ['memory_usage', new MemoryMetricsCollector()],
      ['cpu_usage', new CPUMetricsCollector()],
      ['network_quality', new NetworkQualityCollector()],
      ['user_engagement', new UserEngagementCollector()]
    ]);
  }
  
  // Real-time performance tracking
  async trackPerformance(): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      timestamp: new Date(),
      metrics: {},
      slaCompliance: {},
      recommendations: []
    };
    
    // Collect all metrics
    for (const [name, collector] of this.metrics) {
      report.metrics[name] = await collector.collect();
    }
    
    // Check SLA compliance
    report.slaCompliance = {
      api: this.checkApiSLA(report.metrics),
      database: this.checkDatabaseSLA(report.metrics),
      messaging: await this.checkMessagingSLA()
    };
    
    // Generate recommendations
    report.recommendations = this.generateOptimizationRecommendations(report);
    
    return report;
  }
  
  private generateOptimizationRecommendations(report: PerformanceReport): string[] {
    const recommendations: string[] = [];
    
    // API performance recommendations
    if (report.metrics.api_response_time?.p95 > SLA_TARGETS.api.responseTime.p95) {
      recommendations.push('Consider implementing response caching for frequently accessed endpoints');
      recommendations.push('Review database query optimization for slow endpoints');
    }
    
    // Memory usage recommendations
    if (report.metrics.memory_usage?.percentage > 80) {
      recommendations.push('Memory usage is high - consider implementing memory pooling');