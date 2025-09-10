# Customer & Marketing Module - Deep Technical Implementation

## Advanced Technical Architecture

### 1. Database Schema and Data Modeling

#### Core Customer Management Schema

```sql
-- Enhanced customer table with Nigerian market specifics
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),
    customer_code VARCHAR(50) UNIQUE, -- Auto-generated: CUS-YYYYMMDD-001

    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    display_name VARCHAR(255), -- How customer prefers to be called
    title ENUM('Mr', 'Mrs', 'Ms', 'Dr', 'Chief', 'Alhaji', 'Pastor', 'Rev') DEFAULT 'Mr',

    -- Contact Information
    primary_phone VARCHAR(20) NOT NULL, -- Nigerian format: +2348012345678
    secondary_phone VARCHAR(20),
    whatsapp_number VARCHAR(20), -- Often different from primary phone
    email VARCHAR(255),

    -- Address (Nigerian format)
    street_address TEXT,
    area VARCHAR(100), -- Local area name (e.g., "Surulere", "Wuse 2")
    city VARCHAR(100),
    state VARCHAR(50) REFERENCES nigerian_states(name),
    country VARCHAR(50) DEFAULT 'Nigeria',
    nearest_landmark TEXT, -- Common in Nigerian addressing

    -- Business Information (for B2B customers)
    is_business_customer BOOLEAN DEFAULT FALSE,
    business_name VARCHAR(255),
    business_registration_number VARCHAR(50),
    tax_identification_number VARCHAR(50),

    -- Customer Segmentation
    customer_type ENUM('individual', 'business', 'reseller', 'vip') DEFAULT 'individual',
    acquisition_channel ENUM('walk_in', 'referral', 'social_media', 'online', 'advertisement'),
    customer_source VARCHAR(255), -- Specific source (e.g., "Facebook Ad Campaign Q1")

    -- Financial Information
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 0, -- Days for credit customers
    discount_percentage DECIMAL(5,2) DEFAULT 0,

    -- Personal Preferences
    preferred_language ENUM('english', 'hausa', 'yoruba', 'igbo', 'pidgin') DEFAULT 'english',
    communication_preference ENUM('sms', 'whatsapp', 'call', 'email') DEFAULT 'whatsapp',
    marketing_consent BOOLEAN DEFAULT FALSE,

    -- Important Dates
    date_of_birth DATE,
    anniversary_date DATE,
    first_purchase_date TIMESTAMP,
    last_purchase_date TIMESTAMP,

    -- System Fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Customer transaction history with detailed tracking
CREATE TABLE customer_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    business_id UUID NOT NULL REFERENCES businesses(id),

    -- Transaction Details
    transaction_number VARCHAR(100) UNIQUE NOT NULL, -- TXN-20241225-001
    transaction_type ENUM('sale', 'return', 'credit_payment', 'discount', 'adjustment'),

    -- Financial Information
    gross_amount DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,

    -- Payment Information
    payment_method ENUM('cash', 'transfer', 'pos', 'cheque', 'credit') NOT NULL,
    payment_status ENUM('pending', 'partial', 'completed', 'failed', 'refunded') DEFAULT 'completed',
    payment_reference VARCHAR(255),

    -- Product Information (denormalized for analytics)
    items_purchased JSONB, -- Array of {product_id, name, quantity, price}
    total_items INTEGER,

    -- Metadata
    channel ENUM('in_store', 'online', 'phone', 'whatsapp', 'social_media'),
    location_id UUID REFERENCES business_locations(id),
    sales_person_id UUID REFERENCES users(id),
    notes TEXT,

    -- System Fields
    transaction_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer communication log
CREATE TABLE customer_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    business_id UUID NOT NULL REFERENCES businesses(id),

    -- Communication Details
    communication_type ENUM('sms', 'whatsapp', 'email', 'call', 'in_person'),
    direction ENUM('inbound', 'outbound'),
    subject VARCHAR(255),
    message_content TEXT,

    -- Campaign Information (if applicable)
    campaign_id UUID REFERENCES marketing_campaigns(id),
    template_id UUID REFERENCES message_templates(id),

    -- Status Tracking
    delivery_status ENUM('sent', 'delivered', 'read', 'failed', 'bounced'),
    response_received BOOLEAN DEFAULT FALSE,
    response_content TEXT,

    -- Automation
    is_automated BOOLEAN DEFAULT FALSE,
    trigger_event VARCHAR(100), -- e.g., 'birthday', 'dormant_customer', 'follow_up'

    -- System Fields
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Customer loyalty program
CREATE TABLE loyalty_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id),

    -- Program Configuration
    program_name VARCHAR(255) NOT NULL,
    program_type ENUM('points', 'visits', 'spending_tiers') DEFAULT 'points',
    is_active BOOLEAN DEFAULT TRUE,

    -- Points Configuration
    points_per_naira DECIMAL(5,4) DEFAULT 1.0000, -- 1 point per ₦1
    minimum_spend_for_points DECIMAL(10,2) DEFAULT 0,
    points_expiry_days INTEGER DEFAULT 365,

    -- Tier Configuration
    bronze_threshold DECIMAL(15,2) DEFAULT 0,
    silver_threshold DECIMAL(15,2) DEFAULT 50000,
    gold_threshold DECIMAL(15,2) DEFAULT 200000,
    platinum_threshold DECIMAL(15,2) DEFAULT 500000,

    -- Redemption Configuration
    minimum_redemption_points INTEGER DEFAULT 100,
    points_to_naira_ratio DECIMAL(8,4) DEFAULT 0.0100, -- 100 points = ₦1

    -- System Fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customer loyalty points tracking
CREATE TABLE customer_loyalty_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id),

    -- Points Information
    current_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    redeemed_points INTEGER DEFAULT 0,
    expired_points INTEGER DEFAULT 0,

    -- Tier Information
    current_tier ENUM('bronze', 'silver', 'gold', 'platinum') DEFAULT 'bronze',
    tier_progress DECIMAL(5,2) DEFAULT 0, -- Percentage to next tier
    next_tier_requirement DECIMAL(15,2),

    -- System Fields
    last_earned_at TIMESTAMP,
    last_redeemed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(customer_id, loyalty_program_id)
);
```

### 2. Advanced React Native Implementation

#### State Management Architecture

```typescript
// Zustand store structure for customer management
interface CustomerStore {
  // State
  customers: Customer[];
  selectedCustomer: Customer | null;
  searchQuery: string;
  filters: CustomerFilters;
  loading: boolean;
  error: string | null;

  // Actions
  fetchCustomers: (params?: FetchParams) => Promise<void>;
  searchCustomers: (query: string) => Promise<Customer[]>;
  addCustomer: (customer: CreateCustomerDto) => Promise<Customer>;
  updateCustomer: (id: string, updates: UpdateCustomerDto) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;

  // Filters and Sorting
  setFilters: (filters: CustomerFilters) => void;
  sortCustomers: (sortBy: SortOption) => void;

  // Bulk Operations
  importCustomers: (file: File) => Promise<ImportResult>;
  exportCustomers: (format: "csv" | "excel") => Promise<void>;
  bulkUpdateCustomers: (updates: BulkUpdate[]) => Promise<void>;
}

// Customer interface with Nigerian market specifics
interface Customer {
  id: string;
  customerCode: string;

  // Personal Information
  firstName: string;
  lastName?: string;
  middleName?: string;
  displayName: string;
  title: CustomerTitle;

  // Contact Information
  primaryPhone: string;
  secondaryPhone?: string;
  whatsappNumber?: string;
  email?: string;

  // Address (Nigerian format)
  address: {
    streetAddress?: string;
    area?: string;
    city?: string;
    state?: NigerianState;
    nearestLandmark?: string;
  };

  // Business Information
  isBusinessCustomer: boolean;
  businessInfo?: {
    businessName: string;
    registrationNumber?: string;
    taxId?: string;
  };

  // Customer Analytics
  analytics: {
    totalSpent: number;
    totalTransactions: number;
    averageOrderValue: number;
    lastPurchaseDate?: Date;
    customerLifetimeValue: number;
    loyaltyPoints: number;
    currentTier: LoyaltyTier;
  };

  // Preferences
  preferences: {
    language: SupportedLanguage;
    communicationPreference: CommunicationChannel;
    marketingConsent: boolean;
  };

  // Important Dates
  dateOfBirth?: Date;
  anniversaryDate?: Date;

  // System Fields
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Advanced Customer Components

```typescript
// Enhanced Customer List Component
const CustomerList: React.FC = () => {
  const {
    customers,
    loading,
    searchQuery,
    filters,
    fetchCustomers,
    searchCustomers,
    setFilters,
  } = useCustomerStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  // Infinite scroll implementation
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["customers", searchQuery, filters],
      queryFn: ({ pageParam = 0 }) =>
        fetchCustomers({
          offset: pageParam,
          limit: 20,
          search: searchQuery,
          ...filters,
        }),
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.nextOffset : undefined,
    });

  // Nigerian phone number validation
  const validateNigerianPhone = (phone: string): boolean => {
    const nigerianPhoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    return nigerianPhoneRegex.test(phone);
  };

  // Search with fuzzy matching for Nigerian names
  const handleSearch = useDebouncedCallback(async (query: string) => {
    if (query.length < 2) return;

    const results = await searchCustomers(query);
    // Handle Nigerian name variations (e.g., Chinedu vs Chinidu)
    const fuzzyResults = fuzzySearch(results, query, {
      keys: ["firstName", "lastName", "displayName"],
      threshold: 0.3, // More lenient for name variations
    });

    setSearchResults(fuzzyResults);
  }, 500);

  const renderCustomerItem = ({ item }: { item: Customer }) => (
    <CustomerListItem
      customer={item}
      onSelect={() => handleCustomerSelect(item)}
      onLongPress={() => toggleSelection(item.id)}
      isSelected={selectedCustomers.includes(item.id)}
      showAnalytics={true}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <SearchBar
        placeholder="Search customers by name or phone..."
        value={searchQuery}
        onChangeText={handleSearch}
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInput}
      />

      <FilterRow
        activeFilters={filters}
        onFilterChange={setFilters}
        totalCount={customers.length}
      />

      {selectedCustomers.length > 0 && (
        <BulkActionBar
          selectedCount={selectedCustomers.length}
          onBulkMessage={() => handleBulkMessage(selectedCustomers)}
          onBulkExport={() => handleBulkExport(selectedCustomers)}
          onBulkDelete={() => handleBulkDelete(selectedCustomers)}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={customers}
        renderItem={renderCustomerItem}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        onEndReached={fetchNextPage}
        onEndReachedThreshold={0.1}
        ListFooterComponent={isFetchingNextPage ? <LoadingSpinner /> : null}
        keyExtractor={(item) => item.id}
        getItemLayout={(data, index) => ({
          length: CUSTOMER_ITEM_HEIGHT,
          offset: CUSTOMER_ITEM_HEIGHT * index,
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      />

      <FloatingActionButton
        onPress={() => navigation.navigate("AddCustomer")}
        icon="plus"
        label="Add Customer"
      />
    </View>
  );
};

// Advanced Customer Detail Component
const CustomerDetail: React.FC<{ customerId: string }> = ({ customerId }) => {
  const customer = useCustomerStore((state) =>
    state.customers.find((c) => c.id === customerId)
  );
  const { sendMessage, scheduleMessage } = useMessaging();
  const { generateLoyaltyReport } = useLoyaltyProgram();

  const [activeTab, setActiveTab] = useState<
    "overview" | "transactions" | "communications" | "loyalty"
  >("overview");

  // Real-time customer analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["customer-analytics", customerId],
    queryFn: () => fetchCustomerAnalytics(customerId),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleQuickMessage = () => {
    const templates = getMessageTemplates(customer.preferences.language);
    showActionSheet({
      options: [
        "Thank you message",
        "Follow-up on last purchase",
        "Birthday wishes",
        "Custom message",
        "Cancel",
      ],
      onPress: (index) => {
        if (index < 3) {
          const template = templates[index];
          sendMessage(customer, template);
        } else if (index === 3) {
          navigation.navigate("ComposeMessage", { customer });
        }
      },
    });
  };

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Customer Summary Card */}
      <Card style={styles.summaryCard}>
        <View style={styles.customerHeader}>
          <Avatar
            source={
              customer.profileImage ? { uri: customer.profileImage } : undefined
            }
            title={getInitials(customer.displayName)}
            size={80}
            style={styles.avatar}
          />
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{customer.displayName}</Text>
            <Text style={styles.customerCode}>{customer.customerCode}</Text>
            <Badge
              value={customer.analytics.currentTier}
              badgeStyle={getTierStyle(customer.analytics.currentTier)}
            />
          </View>
          <View style={styles.quickActions}>
            <IconButton
              icon="message-circle"
              onPress={handleQuickMessage}
              style={styles.quickAction}
            />
            <IconButton
              icon="phone"
              onPress={() => callCustomer(customer.primaryPhone)}
              style={styles.quickAction}
            />
            <IconButton
              icon="more-vertical"
              onPress={showMoreOptions}
              style={styles.quickAction}
            />
          </View>
        </View>
      </Card>

      {/* Analytics Dashboard */}
      <AnalyticsCard
        analytics={customer.analytics}
        loading={analyticsLoading}
      />

      {/* Contact Information */}
      <ContactCard customer={customer} onUpdate={handleUpdateContact} />

      {/* Recent Transactions */}
      <RecentTransactionsCard customerId={customerId} />

      {/* Communication History */}
      <RecentCommunicationsCard customerId={customerId} />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{
          index: [
            "overview",
            "transactions",
            "communications",
            "loyalty",
          ].indexOf(activeTab),
          routes: [
            { key: "overview", title: "Overview" },
            { key: "transactions", title: "Transactions" },
            { key: "communications", title: "Messages" },
            { key: "loyalty", title: "Loyalty" },
          ],
        }}
        renderScene={({ route }) => {
          switch (route.key) {
            case "overview":
              return renderOverviewTab();
            case "transactions":
              return <TransactionHistory customerId={customerId} />;
            case "communications":
              return <CommunicationHistory customerId={customerId} />;
            case "loyalty":
              return <LoyaltyDetails customerId={customerId} />;
            default:
              return null;
          }
        }}
        onIndexChange={(index) =>
          setActiveTab(
            ["overview", "transactions", "communications", "loyalty"][
              index
            ] as any
          )
        }
        renderTabBar={(props) => <TabBar {...props} style={styles.tabBar} />}
      />
    </View>
  );
};
```

### 3. Marketing Automation Engine

#### Campaign Management System

```typescript
// Marketing Campaign Database Schema
interface MarketingCampaign {
  id: string;
  businessId: string;

  // Campaign Details
  name: string;
  description: string;
  campaignType: "promotional" | "informational" | "seasonal" | "reactivation";

  // Targeting
  targetSegment: CustomerSegment;
  customFilters: CampaignFilter[];
  estimatedReach: number;

  // Content
  messageTemplates: {
    sms: MessageTemplate;
    whatsapp: MessageTemplate;
    email: MessageTemplate;
  };

  // Scheduling
  schedulingType: "immediate" | "scheduled" | "recurring" | "trigger_based";
  startDate?: Date;
  endDate?: Date;
  recurringPattern?: RecurringPattern;
  triggerEvents?: TriggerEvent[];

  // Status and Results
  status:
    | "draft"
    | "scheduled"
    | "active"
    | "paused"
    | "completed"
    | "cancelled";
  results: CampaignResults;

  // System Fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Advanced Campaign Builder
const CampaignBuilder: React.FC = () => {
  const [campaign, setCampaign] = useState<Partial<MarketingCampaign>>({
    campaignType: "promotional",
    schedulingType: "immediate",
    status: "draft",
  });

  const { customers } = useCustomerStore();
  const { createCampaign, previewCampaign } = useMarketingStore();

  // Real-time audience calculation
  const { data: audienceSize, isLoading: calculatingAudience } = useQuery({
    queryKey: [
      "campaign-audience",
      campaign.targetSegment,
      campaign.customFilters,
    ],
    queryFn: () =>
      calculateAudienceSize(campaign.targetSegment, campaign.customFilters),
    enabled: !!(campaign.targetSegment || campaign.customFilters?.length),
  });

  const handleSegmentChange = (segment: CustomerSegment) => {
    setCampaign((prev) => ({
      ...prev,
      targetSegment: segment,
      estimatedReach: audienceSize || 0,
    }));
  };

  const renderAudienceBuilder = () => (
    <Card title="Target Audience" style={styles.builderCard}>
      <SegmentSelector
        selectedSegment={campaign.targetSegment}
        onSegmentChange={handleSegmentChange}
        customFilters={campaign.customFilters}
        onFiltersChange={(filters) =>
          setCampaign((prev) => ({ ...prev, customFilters: filters }))
        }
      />

      <View style={styles.audiencePreview}>
        <Text style={styles.audienceSize}>
          Estimated Reach:{" "}
          {calculatingAudience ? "..." : audienceSize?.toLocaleString()}{" "}
          customers
        </Text>
        <Button
          title="Preview Audience"
          onPress={() => showAudiencePreview(campaign)}
          type="outline"
          size="sm"
        />
      </View>
    </Card>
  );

  const renderMessageBuilder = () => (
    <Card title="Message Content" style={styles.builderCard}>
      <TabView
        navigationState={{
          index: activeMessageTab,
          routes: [
            { key: "sms", title: "SMS" },
            { key: "whatsapp", title: "WhatsApp" },
            { key: "email", title: "Email" },
          ],
        }}
        renderScene={({ route }) => {
          switch (route.key) {
            case "sms":
              return (
                <SMSMessageBuilder
                  template={campaign.messageTemplates?.sms}
                  onTemplateChange={(template) =>
                    setCampaign((prev) => ({
                      ...prev,
                      messageTemplates: {
                        ...prev.messageTemplates,
                        sms: template,
                      },
                    }))
                  }
                  characterLimit={160}
                  supportedLanguages={[
                    "english",
                    "pidgin",
                    "hausa",
                    "yoruba",
                    "igbo",
                  ]}
                />
              );
            case "whatsapp":
              return (
                <WhatsAppMessageBuilder
                  template={campaign.messageTemplates?.whatsapp}
                  onTemplateChange={(template) =>
                    setCampaign((prev) => ({
                      ...prev,
                      messageTemplates: {
                        ...prev.messageTemplates,
                        whatsapp: template,
                      },
                    }))
                  }
                  supportsMedia={true}
                  supportsButtons={true}
                />
              );
            case "email":
              return (
                <EmailMessageBuilder
                  template={campaign.messageTemplates?.email}
                  onTemplateChange={(template) =>
                    setCampaign((prev) => ({
                      ...prev,
                      messageTemplates: {
                        ...prev.messageTemplates,
                        email: template,
                      },
                    }))
                  }
                  supportsHTML={true}
                />
              );
          }
        }}
        onIndexChange={setActiveMessageTab}
      />

      <PersonalizationHelper
        availableFields={getAvailablePersonalizationFields()}
        onFieldInsert={handlePersonalizationInsert}
      />

      <MessagePreview
        template={getCurrentTemplate()}
        sampleCustomer={getSampleCustomer()}
      />
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <KeyboardAvoidingView behavior="padding">
        {/* Campaign Details */}
        <Card title="Campaign Details" style={styles.builderCard}>
          <Input
            placeholder="Campaign Name"
            value={campaign.name}
            onChangeText={(name) => setCampaign((prev) => ({ ...prev, name }))}
            style={styles.input}
          />

          <Input
            placeholder="Campaign Description"
            value={campaign.description}
            onChangeText={(description) =>
              setCampaign((prev) => ({ ...prev, description }))
            }
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          <ButtonGroup
            buttons={[
              "Promotional",
              "Informational",
              "Seasonal",
              "Reactivation",
            ]}
            selectedIndex={campaignTypeIndex}
            onPress={handleCampaignTypeChange}
            containerStyle={styles.buttonGroup}
          />
        </Card>

        {renderAudienceBuilder()}
        {renderMessageBuilder()}

        {/* Scheduling */}
        <SchedulingBuilder
          schedulingType={campaign.schedulingType}
          onSchedulingChange={(scheduling) =>
            setCampaign((prev) => ({ ...prev, ...scheduling }))
          }
        />

        {/* Preview and Launch */}
        <Card title="Preview & Launch" style={styles.builderCard}>
          <CampaignSummary campaign={campaign} />

          <View style={styles.actionButtons}>
            <Button
              title="Save as Draft"
              onPress={() => saveCampaignDraft(campaign)}
              type="outline"
              style={styles.button}
            />

            <Button
              title="Preview Campaign"
              onPress={() => previewCampaign(campaign)}
              type="solid"
              style={styles.button}
            />

            <Button
              title="Launch Campaign"
              onPress={() => launchCampaign(campaign)}
              type="solid"
              buttonStyle={styles.primaryButton}
              disabled={!isCampaignValid(campaign)}
            />
          </View>
        </Card>
      </KeyboardAvoidingView>
    </ScrollView>
  );
};
```

#### Nigerian Market Communication Integration

```typescript
// WhatsApp Business API Integration
class WhatsAppService {
  private apiKey: string;
  private businessPhoneNumberId: string;

  constructor(config: WhatsAppConfig) {
    this.apiKey = config.apiKey;
    this.businessPhoneNumberId = config.businessPhoneNumberId;
  }

  // Send template message (for marketing campaigns)
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string,
    components?: WhatsAppComponent[]
  ): Promise<MessageResult> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.businessPhoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: this.formatNigerianPhone(to),
            type: "template",
            template: {
              name: templateName,
              language: {
                code: languageCode,
              },
              components: components || [],
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error?.message || "Failed to send WhatsApp message"
        );
      }

      return {
        success: true,
        messageId: result.messages[0].id,
        status: "sent",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: "failed",
      };
    }
  }

  // Send text message (for direct communication)
  async sendTextMessage(to: string, text: string): Promise<MessageResult> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.businessPhoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: this.formatNigerianPhone(to),
            type: "text",
            text: {
              body: text,
            },
          }),
        }
      );

      const result = await response.json();
      return {
        success: response.ok,
        messageId: result.messages?.[0]?.id,
        status: response.ok ? "sent" : "failed",
        error: response.ok ? undefined : result.error?.message,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: "failed",
      };
    }
  }

  // Format Nigerian phone numbers for WhatsApp
  private formatNigerianPhone(phone: string): string {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, "");

    // Handle different Nigerian phone number formats
    if (cleaned.startsWith("234")) {
      return cleaned; // Already in international format
    } else if (cleaned.startsWith("0")) {
      return "234" + cleaned.substring(1); // Remove leading 0 and add country code
    } else if (cleaned.length === 10) {
      return "234" + cleaned; // Add country code
    }

    throw new Error("Invalid Nigerian phone number format");
  }

  // Get message status
  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      const result = await response.json();
      return {
        id: messageId,
        status: result.status,
        timestamp: result.timestamp,
        recipient: result.recipient_id,
      };
    } catch (error) {
      throw new Error(`Failed to get message status: ${error.message}`);
    }
  }
}

// SMS Service for Nigerian networks
class NigerianSMSService {
  private providers: SMSProvider[];

  constructor() {
    this.providers = [
      {
        name: "Termii",
        apiKey: process.env.TERMII_API_KEY,
        baseUrl: "https://api.ng.termii.com/api",
        priority: 1,
        supportedNetworks: ["MTN", "Airtel", "9mobile", "Glo"],
      },
      {
        name: "SMSLive247",
        apiKey: process.env.SMSLIVE247_API_KEY,
        baseUrl: "https://www.smslive247.com/http/index.aspx",
        priority: 2,
        supportedNetworks: ["MTN", "Airtel", "9mobile", "Glo"],
      },
    ];
  }

  // Send SMS with automatic provider failover
  async sendSMS(
    to: string,
    message: string,
    senderId?: string
  ): Promise<MessageResult> {
    const formattedPhone = this.formatNigerianPhone(to);
    const network = this.detectNetwork(formattedPhone);

    // Try providers in order of priority
    for (const provider of this.providers) {
      if (!provider.supportedNetworks.includes(network)) continue;

      try {
        const result = await this.sendViaProvider(
          provider,
          formattedPhone,
          message,
          senderId
        );
        if (result.success) {
          // Log successful send
          this.logSMSDelivery(provider.name, formattedPhone, "sent");
          return result;
        }
      } catch (error) {
        console.warn(`SMS failed via ${provider.name}: ${error.message}`);
        continue;
      }
    }

    return {
      success: false,
      error: "All SMS providers failed",
      status: "failed",
    };
  }

  private async sendViaTermii(
    phone: string,
    message: string,
    senderId = "N-Alert"
  ): Promise<MessageResult> {
    const response = await fetch("https://api.ng.termii.com/api/sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: phone,
        from: senderId,
        sms: message,
        type: "plain",
        api_key: process.env.TERMII_API_KEY,
        channel: "dnd", // Direct route for better delivery
      }),
    });

    const result = await response.json();

    return {
      success: result.code === "ok",
      messageId: result.message_id,
      status: result.code === "ok" ? "sent" : "failed",
      error: result.code !== "ok" ? result.message : undefined,
      cost: result.balance, // Remaining balance
    };
  }

  private detectNetwork(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");
    const prefix = cleaned.substring(0, 7); // First 7 digits including country code

    // Nigerian network prefixes
    const networkPrefixes = {
      MTN: [
        "2348030",
        "2348031",
        "2348032",
        "2348033",
        "2348034",
        "2348035",
        "2348036",
        "2348037",
        "2348038",
        "2348039",
      ],
      Airtel: [
        "2348050",
        "2348051",
        "2348052",
        "2348053",
        "2348054",
        "2348055",
        "2348056",
        "2348057",
        "2348058",
      ],
      Glo: [
        "2348080",
        "2348081",
        "2348082",
        "2348083",
        "2348084",
        "2348085",
        "2348086",
        "2348087",
        "2348088",
        "2348089",
      ],
      "9mobile": [
        "2348090",
        "2348091",
        "2348092",
        "2348093",
        "2348094",
        "2348095",
        "2348096",
        "2348097",
        "2348098",
      ],
    };

    for (const [network, prefixes] of Object.entries(networkPrefixes)) {
      if (prefixes.some((p) => prefix.startsWith(p))) {
        return network;
      }
    }

    return "Unknown";
  }

  private formatNigerianPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("234")) {
      return "+" + cleaned;
    } else if (cleaned.startsWith("0")) {
      return "+234" + cleaned.substring(1);
    } else if (cleaned.length === 10) {
      return "+234" + cleaned;
    }

    throw new Error("Invalid Nigerian phone number");
  }
}

// Email Service with Nigerian market optimization
class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      service: "SendGrid",
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  async sendMarketingEmail(
    to: string,
    subject: string,
    htmlContent: string,
    textContent: string,
    campaignId?: string
  ): Promise<MessageResult> {
    try {
      // Add Nigerian market-specific optimizations
      const optimizedSubject = this.optimizeSubjectForNigeria(subject);
      const optimizedContent = this.addNigerianContext(htmlContent);

      const mailOptions = {
        from: {
          name: "Your Business Name",
          email: process.env.FROM_EMAIL,
        },
        to: to,
        subject: optimizedSubject,
        html: optimizedContent,
        text: textContent,
        headers: {
          "X-Campaign-ID": campaignId,
          "X-Country": "NG",
          "X-Priority": "3", // Normal priority for marketing emails
        },
        // Nigerian timezone consideration
        date: new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }),
      };

      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId,
        status: "sent",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: "failed",
      };
    }
  }

  private optimizeSubjectForNigeria(subject: string): string {
    // Add Nigerian context if not present
    const nigerianKeywords = ["Nigeria", "Naira", "Lagos", "Abuja"];
    const hasNigerianContext = nigerianKeywords.some((keyword) =>
      subject.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasNigerianContext && subject.includes("₦")) {
      // Currency symbol provides Nigerian context
      return subject;
    }

    // Add subtle Nigerian context for better engagement
    return subject;
  }

  private addNigerianContext(htmlContent: string): string {
    // Replace generic currency with Naira
    let optimized = htmlContent.replace(/\$(\d+)/g, "₦$1");

    // Add Nigerian contact context
    optimized = optimized.replace(
      /contact\s+us/gi,
      "contact us (Lagos time: GMT+1)"
    );

    return optimized;
  }
}
```

### 4. Advanced Analytics and Reporting System

```typescript
// Customer Analytics Engine
class CustomerAnalyticsEngine {
  private database: Database;
  private cacheService: RedisClient;

  constructor(database: Database, cacheService: RedisClient) {
    this.database = database;
    this.cacheService = cacheService;
  }

  // Calculate Customer Lifetime Value with Nigerian market factors
  async calculateCLV(customerId: string): Promise<CLVAnalysis> {
    const cacheKey = `clv:${customerId}`;
    const cached = await this.cacheService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    const customerData = await this.database.query(
      `
      SELECT 
        c.id,
        c.first_purchase_date,
        c.last_purchase_date,
        COUNT(ct.id) as total_transactions,
        SUM(ct.net_amount) as total_spent,
        AVG(ct.net_amount) as average_order_value,
        EXTRACT(days FROM (c.last_purchase_date - c.first_purchase_date)) as customer_lifespan,
        -- Nigerian market factors
        CASE 
          WHEN c.state IN ('Lagos', 'Abuja', 'Rivers') THEN 1.2 -- Urban premium
          WHEN c.state IN ('Kano', 'Kaduna', 'Oyo') THEN 1.1 -- Semi-urban
          ELSE 1.0 -- Rural baseline
        END as location_multiplier,
        CASE
          WHEN c.customer_type = 'business' THEN 1.5
          WHEN c.customer_type = 'reseller' THEN 1.8
          ELSE 1.0
        END as customer_type_multiplier
      FROM customers c
      LEFT JOIN customer_transactions ct ON c.id = ct.customer_id
      WHERE c.id = $1 AND c.is_active = true
      GROUP BY c.id
    `,
      [customerId]
    );

    const customer = customerData.rows[0];

    if (!customer) {
      throw new Error("Customer not found");
    }

    // Calculate purchase frequency (purchases per month)
    const lifespanMonths = Math.max(customer.customer_lifespan / 30, 1);
    const purchaseFrequency = customer.total_transactions / lifespanMonths;

    // Nigerian market-adjusted CLV calculation
    const baseCLV = customer.average_order_value * purchaseFrequency * 24; // 24-month projection
    const adjustedCLV =
      baseCLV *
      customer.location_multiplier *
      customer.customer_type_multiplier;

    // Apply Nigerian economic factors (inflation, forex)
    const economicAdjustment = await this.getNigerianEconomicFactor();
    const finalCLV = adjustedCLV * economicAdjustment;

    const clvAnalysis: CLVAnalysis = {
      customerId,
      currentCLV: finalCLV,
      predictedCLV: this.predictFutureCLV(customer, finalCLV),
      riskScore: this.calculateChurnRisk(customer),
      segmentRecommendation: this.recommendSegment(finalCLV, customer),
      actionableInsights: this.generateInsights(customer, finalCLV),
    };

    // Cache for 1 hour
    await this.cacheService.setex(cacheKey, 3600, JSON.stringify(clvAnalysis));

    return clvAnalysis;
  }

  // RFM Analysis adapted for Nigerian market
  async performRFMAnalysis(businessId: string): Promise<RFMAnalysis[]> {
    const rfmQuery = `
      WITH customer_rfm AS (
        SELECT 
          c.id as customer_id,
          c.display_name,
          c.state,
          c.customer_type,
          -- Recency: Days since last purchase
          EXTRACT(days FROM (NOW() - MAX(ct.transaction_date))) as recency,
          -- Frequency: Number of transactions
          COUNT(ct.id) as frequency,
          -- Monetary: Total amount spent
          SUM(ct.net_amount) as monetary,
          -- Nigerian market context
          CASE 
            WHEN c.state IN ('Lagos', 'Abuja', 'Rivers') THEN 'Urban'
            WHEN c.state IN ('Kano', 'Kaduna', 'Oyo', 'Anambra') THEN 'Semi-Urban'
            ELSE 'Rural'
          END as location_category
        FROM customers c
        LEFT JOIN customer_transactions ct ON c.id = ct.customer_id
        WHERE c.business_id = $1 AND c.is_active = true
        GROUP BY c.id, c.display_name, c.state, c.customer_type
      ),
      rfm_scores AS (
        SELECT *,
          -- Recency score (1-5, where 5 is most recent)
          NTILE(5) OVER (ORDER BY recency DESC) as r_score,
          -- Frequency score (1-5, where 5 is most frequent)
          NTILE(5) OVER (ORDER BY frequency ASC) as f_score,
          -- Monetary score (1-5, where 5 is highest value)
          NTILE(5) OVER (ORDER BY monetary ASC) as m_score
        FROM customer_rfm
      )
      SELECT *,
        CONCAT(r_score, f_score, m_score) as rfm_score,
        CASE 
          WHEN r_score >= 4 AND f_score >= 4 AND m_score >= 4 THEN 'Champions'
          WHEN r_score >= 3 AND f_score >= 3 AND m_score >= 3 THEN 'Loyal Customers'
          WHEN r_score >= 4 AND f_score <= 2 AND m_score >= 3 THEN 'New Customers'
          WHEN r_score >= 3 AND f_score <= 2 AND m_score <= 2 THEN 'Potential Loyalists'
          WHEN r_score <= 2 AND f_score >= 3 AND m_score >= 3 THEN 'At Risk'
          WHEN r_score <= 2 AND f_score <= 2 AND m_score >= 4 THEN 'Cannot Lose Them'
          WHEN r_score <= 1 AND f_score <= 2 THEN 'Lost Customers'
          ELSE 'Others'
        END as customer_segment
      FROM rfm_scores
      ORDER BY monetary DESC
    `;

    const result = await this.database.query(rfmQuery, [businessId]);

    return result.rows.map((row) => ({
      customerId: row.customer_id,
      customerName: row.display_name,
      recency: row.recency,
      frequency: row.frequency,
      monetary: row.monetary,
      rfmScore: row.rfm_score,
      segment: row.customer_segment,
      locationCategory: row.location_category,
      recommendations: this.generateRFMRecommendations(row),
    }));
  }

  // Generate actionable insights for Nigerian SMEs
  private generateInsights(
    customerData: any,
    clv: number
  ): ActionableInsight[] {
    const insights: ActionableInsight[] = [];

    // High-value customer insights
    if (clv > 100000) {
      // ₦100,000+
      insights.push({
        type: "opportunity",
        priority: "high",
        title: "VIP Customer Opportunity",
        description:
          "This customer has high lifetime value. Consider offering exclusive products or personalized service.",
        action: "Create VIP program enrollment",
        estimatedImpact: "Increase retention by 25%",
      });
    }

    // Dormant customer insights
    const daysSinceLastPurchase =
      (new Date().getTime() -
        new Date(customerData.last_purchase_date).getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysSinceLastPurchase > 60) {
      insights.push({
        type: "risk",
        priority: "medium",
        title: "Customer Reactivation Needed",
        description: `Customer hasn't purchased in ${Math.round(
          daysSinceLastPurchase
        )} days. Risk of churn is increasing.`,
        action: "Send reactivation campaign with discount",
        estimatedImpact: "Reduce churn risk by 40%",
      });
    }

    // Purchase pattern insights
    if (customerData.purchase_frequency > 2) {
      insights.push({
        type: "opportunity",
        priority: "medium",
        title: "Frequent Buyer Program",
        description:
          "Customer makes regular purchases. Perfect candidate for loyalty program.",
        action: "Enroll in loyalty program with bonus points",
        estimatedImpact: "Increase purchase frequency by 15%",
      });
    }

    return insights;
  }

  // Nigerian economic factors integration
  private async getNigerianEconomicFactor(): Promise<number> {
    try {
      // Integrate with Nigerian economic indicators API
      const economicData = await fetch(
        "https://api.cbn.gov.ng/v2/rates/exchange"
      );
      const data = await economicData.json();

      // Calculate adjustment based on inflation and forex
      const usdNgn = data.find((rate) => rate.currency === "USD");
      const currentRate = parseFloat(usdNgn?.buying_rate || "800");
      const baselineRate = 750; // Baseline for calculations

      // Adjust CLV based on currency strength
      const adjustment = Math.min(
        Math.max(baselineRate / currentRate, 0.8),
        1.2
      );

      return adjustment;
    } catch (error) {
      console.warn("Failed to fetch economic data, using default adjustment");
      return 1.0; // Default adjustment
    }
  }
}

// Advanced Reporting Dashboard
const AnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });
  const [selectedSegment, setSelectedSegment] = useState<string>("all");

  // Real-time analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["customer-analytics", dateRange, selectedSegment],
    queryFn: () => fetchCustomerAnalytics(dateRange, selectedSegment),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: rfmAnalysis } = useQuery({
    queryKey: ["rfm-analysis"],
    queryFn: fetchRFMAnalysis,
    staleTime: 300000, // 5 minutes
  });

  const renderKPICards = () => (
    <View style={styles.kpiContainer}>
      <KPICard
        title="Total Customers"
        value={analytics?.totalCustomers?.toLocaleString()}
        change={analytics?.customerGrowth}
        changeType="percentage"
        icon="users"
        color={colors.primary}
      />

      <KPICard
        title="Average CLV"
        value={`₦${analytics?.averageCLV?.toLocaleString()}`}
        change={analytics?.clvGrowth}
        changeType="currency"
        icon="trending-up"
        color={colors.success}
      />

      <KPICard
        title="Active Customers"
        value={analytics?.activeCustomers?.toLocaleString()}
        subtitle="Last 30 days"
        icon="activity"
        color={colors.info}
      />

      <KPICard
        title="Churn Risk"
        value={`${analytics?.churnRisk}%`}
        change={analytics?.churnChange}
        changeType="percentage"
        icon="alert-triangle"
        color={colors.warning}
        invertChange={true}
      />
    </View>
  );

  const renderCustomerSegmentation = () => (
    <Card title="Customer Segmentation (RFM Analysis)" style={styles.chartCard}>
      <View style={styles.segmentFilters}>
        <SegmentPicker
          selectedSegment={selectedSegment}
          onSegmentChange={setSelectedSegment}
          segments={rfmAnalysis?.segments || []}
        />
      </View>

      <PieChart
        data={rfmAnalysis?.segmentDistribution || []}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />

      <SegmentInsights
        segments={rfmAnalysis?.segments}
        selectedSegment={selectedSegment}
      />
    </Card>
  );

  const renderPurchaseBehavior = () => (
    <Card title="Purchase Behavior Analysis" style={styles.chartCard}>
      <TabView
        navigationState={{
          index: behaviorTabIndex,
          routes: [
            { key: "frequency", title: "Frequency" },
            { key: "timing", title: "Timing" },
            { key: "seasonal", title: "Seasonal" },
          ],
        }}
        renderScene={({ route }) => {
          switch (route.key) {
            case "frequency":
              return (
                <BarChart
                  data={analytics?.purchaseFrequency || []}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                />
              );
            case "timing":
              return (
                <LineChart
                  data={analytics?.purchaseTiming || []}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={chartConfig}
                />
              );
            case "seasonal":
              return (
                <SeasonalChart
                  data={analytics?.seasonalTrends || []}
                  nigerianSeasons={true}
                  width={screenWidth - 40}
                  height={220}
                />
              );
          }
        }}
        onIndexChange={setBehaviorTabIndex}
      />
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customer Analytics</Text>
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onDateRangeChange={setDateRange}
          maxDate={new Date()}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {renderKPICards()}
          {renderCustomerSegmentation()}
          {renderPurchaseBehavior()}

          <GeographicAnalysis
            data={analytics?.geographicDistribution}
            focusCountry="Nigeria"
          />

          <CampaignPerformance
            campaigns={analytics?.campaignResults}
            dateRange={dateRange}
          />

          <ActionableInsights
            insights={analytics?.insights}
            onInsightAction={handleInsightAction}
          />
        </>
      )}
    </ScrollView>
  );
};
```

### 5. Online Store Builder Implementation

```typescript
// Advanced Store Builder for Nigerian SMEs
const OnlineStoreBuilder: React.FC = () => {
  const [store, setStore] = useState<OnlineStore>({
    businessInfo: {},
    design: {
      template: "modern",
      colors: {
        primary: "#2E7D32",
        secondary: "#FFA726",
        accent: "#1565C0",
      },
    },
    products: [],
    settings: {
      currency: "NGN",
      language: "en",
      timezone: "Africa/Lagos",
    },
  });

  const [currentStep, setCurrentStep] = useState(0);
  const { createStore, updateStore, publishStore } = useStoreBuilder();

  const storeBuilderSteps = [
    "Business Information",
    "Store Design",
    "Product Catalog",
    "Payment Setup",
    "Shipping & Delivery",
    "Preview & Launch",
  ];

  const renderBusinessInfoStep = () => (
    <Card title="Business Information" style={styles.stepCard}>
      <Input
        label="Business Name"
        placeholder="Enter your business name"
        value={store.businessInfo.name}
        onChangeText={(name) =>
          setStore((prev) => ({
            ...prev,
            businessInfo: { ...prev.businessInfo, name },
          }))
        }
        required
      />

      <Input
        label="Business Description"
        placeholder="Tell customers about your business"
        value={store.businessInfo.description}
        onChangeText={(description) =>
          setStore((prev) => ({
            ...prev,
            businessInfo: { ...prev.businessInfo, description },
          }))
        }
        multiline
        numberOfLines={4}
      />

      <View style={styles.formRow}>
        <Input
          label="Phone Number"
          placeholder="+234 800 123 4567"
          value={store.businessInfo.phone}
          onChangeText={(phone) =>
            setStore((prev) => ({
              ...prev,
              businessInfo: { ...prev.businessInfo, phone },
            }))
          }
          keyboardType="phone-pad"
          style={styles.halfInput}
        />

        <Input
          label="Email Address"
          placeholder="business@example.com"
          value={store.businessInfo.email}
          onChangeText={(email) =>
            setStore((prev) => ({
              ...prev,
              businessInfo: { ...prev.businessInfo, email },
            }))
          }
          keyboardType="email-address"
          style={styles.halfInput}
        />
      </View>

      <AddressInput
        label="Business Address"
        value={store.businessInfo.address}
        onAddressChange={(address) =>
          setStore((prev) => ({
            ...prev,
            businessInfo: { ...prev.businessInfo, address },
          }))
        }
        country="Nigeria"
        showNearestLandmark={true}
      />

      <BusinessCategoryPicker
        selectedCategory={store.businessInfo.category}
        onCategoryChange={(category) =>
          setStore((prev) => ({
            ...prev,
            businessInfo: { ...prev.businessInfo, category },
          }))
        }
        categories={NIGERIAN_BUSINESS_CATEGORIES}
      />
    </Card>
  );

  const renderDesignStep = () => (
    <Card title="Store Design" style={styles.stepCard}>
      <Text style={styles.sectionTitle}>Choose a Template</Text>
      <TemplateGallery
        templates={STORE_TEMPLATES}
        selectedTemplate={store.design.template}
        onTemplateSelect={(template) =>
          setStore((prev) => ({
            ...prev,
            design: { ...prev.design, template },
          }))
        }
      />

      <Text style={styles.sectionTitle}>Customize Colors</Text>
      <ColorPicker
        colors={store.design.colors}
        onColorsChange={(colors) =>
          setStore((prev) => ({
            ...prev,
            design: { ...prev.design, colors },
          }))
        }
        presets={NIGERIAN_COLOR_PRESETS}
      />

      <Text style={styles.sectionTitle}>Logo & Branding</Text>
      <LogoUploader
        currentLogo={store.design.logo}
        onLogoUpload={(logo) =>
          setStore((prev) => ({
            ...prev,
            design: { ...prev.design, logo },
          }))
        }
        guidelines="Upload a square logo (512x512px) for best results"
      />

      <StorePreview store={store} device="mobile" style={styles.preview} />
    </Card>
  );

  const renderProductCatalogStep = () => (
    <Card title="Product Catalog" style={styles.stepCard}>
      <View style={styles.catalogHeader}>
        <Text style={styles.sectionTitle}>Your Products</Text>
        <Button
          title="Import from Inventory"
          onPress={handleImportFromInventory}
          type="outline"
          size="sm"
        />
        <Button
          title="Add Product"
          onPress={() => setShowAddProduct(true)}
          type="solid"
          size="sm"
        />
      </View>

      <ProductGrid
        products={store.products}
        onProductEdit={handleProductEdit}
        onProductDelete={handleProductDelete}
        onProductReorder={handleProductReorder}
        allowBulkEdit={true}
      />

      <BulkProductActions
        selectedProducts={selectedProducts}
        onBulkPriceUpdate={handleBulkPriceUpdate}
        onBulkCategoryUpdate={handleBulkCategoryUpdate}
        onBulkStatusUpdate={handleBulkStatusUpdate}
      />

      <ProductImportOptions
        onCSVImport={handleCSVImport}
        onExcelImport={handleExcelImport}
        onInventorySync={handleInventorySync}
      />
    </Card>
  );

  const renderPaymentSetupStep = () => (
    <Card title="Payment Setup" style={styles.stepCard}>
      <Text style={styles.sectionTitle}>Nigerian Payment Methods</Text>

      <PaymentMethodSelector
        availableMethods={[
          {
            id: "paystack",
            name: "Paystack",
            description: "Cards, Bank Transfer, USSD",
            fees: "1.5% + ₦100",
            logo: paystackLogo,
            supported: true,
            recommended: true,
          },
          {
            id: "flutterwave",
            name: "Flutterwave",
            description: "Cards, Bank Transfer, Mobile Money",
            fees: "1.4% + ₦100",
            logo: flutterwaveLogo,
            supported: true,
          },
          {
            id: "interswitch",
            name: "Interswitch",
            description: "Verve Cards, WebPAY",
            fees: "1.25%",
            logo: interswitchLogo,
            supported: true,
          },
          {
            id: "bank_transfer",
            name: "Direct Bank Transfer",
            description: "Manual verification required",
            fees: "Free",
            icon: "bank",
            supported: true,
          },
          {
            id: "cash_on_delivery",
            name: "Cash on Delivery",
            description: "Pay when you receive",
            fees: "Free",
            icon: "truck",
            supported: true,
          },
        ]}
        selectedMethods={store.paymentMethods}
        onMethodsChange={(methods) =>
          setStore((prev) => ({
            ...prev,
            paymentMethods: methods,
          }))
        }
      />

      <PaymentConfiguration
        methods={store.paymentMethods}
        onConfigurationChange={handlePaymentConfigChange}
      />

      <TaxSettings
        vatRate={7.5} // Nigerian VAT rate
        enableTax={store.settings.enableTax}
        onTaxSettingsChange={handleTaxSettingsChange}
      />
    </Card>
  );

  const renderShippingStep = () => (
    <Card title="Shipping & Delivery" style={styles.stepCard}>
      <Text style={styles.sectionTitle}>Delivery Options</Text>

      <DeliveryOptionsSelector
        options={[
          {
            id: "pickup",
            name: "Customer Pickup",
            description: "Customers collect from your location",
            cost: 0,
            icon: "map-pin",
            enabled: true,
          },
          {
            id: "local_delivery",
            name: "Local Delivery",
            description: "Within your city/area",
            cost: 500,
            zones: store.deliveryZones,
            icon: "truck",
            enabled: true,
          },
          {
            id: "gig_logistics",
            name: "GIG Logistics",
            description: "Nationwide delivery",
            fees: "Calculated by weight/distance",
            logo: gigLogisticsLogo,
            apiIntegration: true,
            enabled: false,
          },
          {
            id: "jumia_logistics",
            name: "Jumia Logistics",
            description: "Express delivery in major cities",
            fees: "Starting from ₦800",
            logo: jumiaLogisticsLogo,
            apiIntegration: true,
            enabled: false,
          },
        ]}
        selectedOptions={store.deliveryOptions}
        onOptionsChange={(options) =>
          setStore((prev) => ({
            ...prev,
            deliveryOptions: options,
          }))
        }
      />

      <DeliveryZoneManager
        zones={store.deliveryZones}
        onZonesChange={(zones) =>
          setStore((prev) => ({
            ...prev,
            deliveryZones: zones,
          }))
        }
        defaultCity={store.businessInfo.address?.city}
      />

      <ShippingCalculator
        options={store.deliveryOptions}
        zones={store.deliveryZones}
        onCalculationRuleChange={handleShippingRuleChange}
      />
    </Card>
  );

  const renderPreviewStep = () => (
    <Card title="Preview & Launch" style={styles.stepCard}>
      <StorePreview
        store={store}
        devices={["mobile", "tablet", "desktop"]}
        showInteractive={true}
      />

      <LaunchChecklist
        store={store}
        requirements={[
          {
            id: "business_info",
            label: "Business Information Complete",
            required: true,
          },
          {
            id: "products",
            label: "At least 3 products added",
            required: true,
          },
          { id: "payment", label: "Payment method configured", required: true },
          { id: "delivery", label: "Delivery options set", required: true },
          { id: "legal", label: "Terms & Privacy Policy", required: false },
          { id: "seo", label: "SEO optimization", required: false },
        ]}
        onRequirementComplete={handleRequirementComplete}
      />

      <DomainSettings
        customDomain={store.settings.customDomain}
        subdomain={store.settings.subdomain}
        onDomainChange={handleDomainChange}
      />

      <SocialMediaIntegration
        platforms={store.socialMedia}
        onPlatformConnect={handleSocialConnect}
      />

      <View style={styles.launchActions}>
        <Button
          title="Save as Draft"
          onPress={() => saveStoreDraft(store)}
          type="outline"
          style={styles.button}
        />

        <Button
          title="Preview Live"
          onPress={() => previewStore(store)}
          type="solid"
          style={styles.button}
        />

        <Button
          title="Launch Store"
          onPress={() => publishStore(store)}
          type="solid"
          buttonStyle={styles.primaryButton}
          disabled={!isStoreReadyForLaunch(store)}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ProgressIndicator
        steps={storeBuilderSteps}
        currentStep={currentStep}
        onStepPress={setCurrentStep}
      />

      <ScrollView style={styles.content}>
        {currentStep === 0 && renderBusinessInfoStep()}
        {currentStep === 1 && renderDesignStep()}
        {currentStep === 2 && renderProductCatalogStep()}
        {currentStep === 3 && renderPaymentSetupStep()}
        {currentStep === 4 && renderShippingStep()}
        {currentStep === 5 && renderPreviewStep()}
      </ScrollView>

      <View style={styles.navigationButtons}>
        <Button
          title="Previous"
          onPress={() => setCurrentStep(Math.max(0, currentStep - 1))}
          type="outline"
          disabled={currentStep === 0}
        />

        <Button
          title={
            currentStep === storeBuilderSteps.length - 1 ? "Launch" : "Next"
          }
          onPress={() => {
            if (currentStep === storeBuilderSteps.length - 1) {
              publishStore(store);
            } else {
              setCurrentStep(
                Math.min(storeBuilderSteps.length - 1, currentStep + 1)
              );
            }
          }}
          type="solid"
        />
      </View>
    </View>
  );
};

// Enhanced Store Management Dashboard
const StoreManagementDashboard: React.FC = () => {
  const { store, orders, analytics } = useStore();
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "products" | "customers" | "analytics"
  >("overview");

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent}>
      <StoreStatsCards
        visitors={analytics.visitors}
        orders={analytics.orders}
        revenue={analytics.revenue}
        conversionRate={analytics.conversionRate}
      />

      <QuickActionsGrid
        actions={[
          {
            id: "add_product",
            title: "Add Product",
            icon: "plus",
            onPress: () => navigation.navigate("AddProduct"),
          },
          {
            id: "process_order",
            title: "Process Orders",
            icon: "package",
            badge: orders.pending.length,
          },
          {
            id: "update_inventory",
            title: "Update Inventory",
            icon: "archive",
          },
          { id: "create_promotion", title: "Create Promotion", icon: "tag" },
          { id: "share_store", title: "Share Store", icon: "share-2" },
          {
            id: "view_analytics",
            title: "View Analytics",
            icon: "bar-chart-2",
          },
        ]}
      />

      <RecentOrdersWidget
        orders={orders.recent}
        onOrderAction={handleOrderAction}
      />

      <TopProductsWidget products={analytics.topProducts} period="7d" />

      <StorePerformanceChart
        data={analytics.performanceData}
        metrics={["visitors", "orders", "revenue"]}
      />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <StoreHeader
        storeName={store.businessInfo.name}
        storeUrl={store.url}
        isLive={store.isPublished}
        onToggleLive={handleToggleStoreLive}
      />

      <TabView
        navigationState={{
          index: [
            "overview",
            "orders",
            "products",
            "customers",
            "analytics",
          ].indexOf(activeTab),
          routes: [
            { key: "overview", title: "Overview" },
            { key: "orders", title: "Orders", badge: orders.pending.length },
            { key: "products", title: "Products" },
            { key: "customers", title: "Customers" },
            { key: "analytics", title: "Analytics" },
          ],
        }}
        renderScene={({ route }) => {
          switch (route.key) {
            case "overview":
              return renderOverviewTab();
            case "orders":
              return <OrderManagement orders={orders} />;
            case "products":
              return <ProductManagement products={store.products} />;
            case "customers":
              return <StoreCustomers storeId={store.id} />;
            case "analytics":
              return <StoreAnalytics storeId={store.id} />;
            default:
              return null;
          }
        }}
        onIndexChange={(index) =>
          setActiveTab(
            ["overview", "orders", "products", "customers", "analytics"][
              index
            ] as any
          )
        }
        renderTabBar={(props) => <TabBar {...props} style={styles.tabBar} />}
      />
    </View>
  );
};
```
