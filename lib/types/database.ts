// ============================================================
// Saba Store — TypeScript Database Types
// Generated structure matching the Supabase schema
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================================
// ENUMS
// ============================================================
export type UserRole = "merchant" | "admin" | "customer" | "platform_admin";
export type StoreStatus = "active" | "suspended" | "pending" | "trial";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "pending"
  | "rejected"
  | "expired";

export type OrderStatus =
  | "جديد"
  | "بانتظار_تأكيد_الدفع"
  | "تم_تأكيد_الدفع"
  | "فشل_الدفع"
  | "قيد_التجهيز"
  | "تم_الشحن"
  | "مكتمل"
  | "ملغي";

export type PaymentMethodType =
  | "bank_transfer"
  | "local_wallet"
  | "cash_on_delivery"
  | "custom";

export type ProofStatus = "pending" | "approved" | "rejected";

export type ProductType = "physical" | "digital" | "subscription" | "service";

export type ShippingMethodType =
  | "fixed"
  | "city_based"
  | "free"
  | "pickup"
  | "custom";

export type AiGenerationType =
  | "product_name"
  | "product_description"
  | "homepage_content"
  | "homepage_title"
  | "homepage_description"
  | "about_us"
  | "return_policy"
  | "privacy_policy"
  | "terms_of_service"
  | "social_ad_copy"
  | "store_slogan"
  | "category_description"
  | "product_seo_title"
  | "product_seo_description"
  | "instagram_post"
  | "short_ad"
  | "promo_message"
  | "theme_config";

export type NotificationType =
  | "new_order"
  | "payment_confirmed"
  | "payment_rejected"
  | "low_stock"
  | "new_customer"
  | "system";

// ============================================================
// DATABASE TYPES (matches Supabase schema)
// ============================================================
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          phone?: string | null;
          updated_at?: string;
        };
      };
      packages: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number | null;
          max_products: number | null;
          max_ai_credits: number;
          max_themes: number;
          has_custom_domain: boolean;
          has_advanced_theme: boolean;
          has_custom_css: boolean;
          has_custom_html: boolean;
          has_whatsapp_notif: boolean;
          has_email_notif: boolean;
          has_reports: boolean;
          has_priority_support: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["packages"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["packages"]["Insert"]>;
      };
      themes: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category: string;
          preview_image: string | null;
          thumbnail_url: string | null;
          is_active: boolean;
          is_premium: boolean;
          sort_order: number;
          config: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["themes"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["themes"]["Insert"]>;
      };
      stores: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          subdomain: string | null;
          description: string | null;
          logo_url: string | null;
          favicon_url: string | null;
          cover_url: string | null;
          requires_shipping: boolean;
          email: string | null;
          phone: string | null;
          whatsapp: string | null;
          address: string | null;
          city: string | null;
          country: string;
          currency: string;
          status: StoreStatus;
          current_theme_id: string | null;
          package_id: string | null;
          meta_title: string | null;
          meta_description: string | null;
          social_links: Json;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["stores"]["Row"], "owner_id" | "name" | "slug" | "country" | "currency" | "package_id" | "status">> & {
          owner_id: string;
          name: string;
          slug: string;
          country: string;
          currency: string;
          package_id: string;
          status: StoreStatus;
        };
        Update: Partial<Database["public"]["Tables"]["stores"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          store_id: string;
          package_id: string;
          status: SubscriptionStatus;
          trial_starts_at: string | null;
          trial_ends_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          canceled_at: string | null;
          payment_proof_url: string | null;
          admin_note: string | null;
          plan: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["subscriptions"]["Row"], "store_id" | "package_id" | "status">> & {
          store_id: string;
          package_id: string;
          status: SubscriptionStatus;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          store_id: string;
          parent_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      products: {
        Row: {
          id: string;
          store_id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          short_description: string | null;
          price: number;
          compare_price: number | null;
          sku: string | null;
          barcode: string | null;
          stock_quantity: number;
          track_inventory: boolean;
          is_active: boolean;
          is_featured: boolean;
          is_digital: boolean;
          product_type: ProductType;
          subscription_duration_value: number | null;
          subscription_duration_unit: string | null;
          weight: number | null;
          meta_title: string | null;
          meta_description: string | null;
          tags: string[];
          attributes: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["products"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      customers: {
        Row: {
          id: string;
          store_id: string;
          full_name: string;
          email: string | null;
          phone: string | null;
          city: string | null;
          address: string | null;
          notes: string | null;
          orders_count: number;
          total_spent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["customers"]["Row"], "id" | "orders_count" | "total_spent" | "created_at" | "updated_at" | "email" | "phone" | "city" | "address" | "notes"> & {
          id?: string;
          email?: string | null;
          phone?: string | null;
          city?: string | null;
          address?: string | null;
          notes?: string | null;
          orders_count?: number;
          total_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          store_id: string;
          customer_id: string | null;
          order_number: string;
          status: OrderStatus;
          full_name: string;
          phone: string;
          email: string | null;
          city: string;
          address: string;
          notes: string | null;
          subtotal: number;
          shipping_cost: number;
          discount_amount: number;
          total_amount: number;
          payment_method_id: string | null;
          shipping_method_id: string | null;
          payment_status: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "created_at" | "updated_at" | "customer_id" | "order_number" | "notes" | "payment_method_id" | "shipping_method_id" | "payment_status" | "shipped_at" | "delivered_at" | "canceled_at"> & {
          id?: string;
          customer_id?: string | null;
          order_number?: string;
          notes?: string | null;
          payment_method_id?: string | null;
          shipping_method_id?: string | null;
          payment_status?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      ai_credits: {
        Row: {
          id: string;
          store_id: string;
          credits_total: number;
          credits_used: number;
          reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["ai_credits"]["Row"], "store_id" | "credits_total">> & {
          store_id: string;
          credits_total: number;
        };
        Update: Partial<Database["public"]["Tables"]["ai_credits"]["Insert"]>;
      };
      ai_generations: {
        Row: {
          id: string;
          store_id: string;
          type: AiGenerationType;
          prompt_input: string | null;
          generated_text: string;
          credits_used: number;
          is_published: boolean;
          model_used: string | null;
          user_id: string | null;
          provider: string | null;
          status: string;
          error_message: string | null;
          created_at: string;
          config_output: Json | null;
          review_status: "pending" | "applied" | "rejected" | null;
        };
        Insert: Omit<Database["public"]["Tables"]["ai_generations"]["Row"], "id" | "created_at" | "is_published" | "user_id" | "provider" | "status" | "error_message" | "config_output" | "review_status"> & {
          id?: string;
          is_published?: boolean;
          user_id?: string | null;
          provider?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
          config_output?: Json | null;
          review_status?: "pending" | "applied" | "rejected" | null;
        };
        Update: Partial<Database["public"]["Tables"]["ai_generations"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          store_id: string;
          type: NotificationType;
          title: string;
          message: string | null;
          data: Json;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      payment_methods: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          type: PaymentMethodType;
          account_holder_name: string | null;
          bank_name: string | null;
          account_number: string | null;
          iban: string | null;
          instructions: string | null;
          qr_image_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payment_methods"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_methods"]["Insert"]>;
      };
      shipping_methods: {
        Row: {
          id: string;
          store_id: string;
          name: string;
          type: ShippingMethodType;
          base_price: number;
          free_shipping_threshold: number | null;
          pickup_address: string | null;
          estimated_days_min: number | null;
          estimated_days_max: number | null;
          notes: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["shipping_methods"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipping_methods"]["Insert"]>;
      };
      shipping_zones: {
        Row: {
          id: string;
          store_id: string;
          shipping_method_id: string;
          city_name: string;
          price: number;
          estimated_days_min: number | null;
          estimated_days_max: number | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["shipping_zones"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipping_zones"]["Insert"]>;
      };
      product_images: {
        Row: {
          id: string;
          store_id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["product_images"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          store_id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          product_sku: string | null;
          quantity: number;
          unit_price: number;
          total_price: number;
          attributes: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id" | "created_at" | "product_sku" | "attributes"> & {
          id?: string;
          product_sku?: string | null;
          attributes?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
      };
      payment_proofs: {
        Row: {
          id: string;
          store_id: string;
          order_id: string;
          uploaded_file_url: string;
          transaction_reference: string | null;
          payer_name: string | null;
          uploaded_at: string;
          review_status: ProofStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          rejection_reason: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["payment_proofs"]["Row"], "id" | "uploaded_at" | "review_status" | "transaction_reference" | "payer_name" | "reviewed_by" | "reviewed_at" | "rejection_reason"> & {
          id?: string;
          transaction_reference?: string | null;
          payer_name?: string | null;
          uploaded_at?: string;
          review_status?: ProofStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          rejection_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payment_proofs"]["Insert"]>;
      };
      store_theme_settings: {
        Row: {
          id: string;
          store_id: string;
          theme_id: string;
          primary_color: string;
          secondary_color: string;
          accent_color: string;
          font_family: string;
          hero_title: string | null;
          hero_subtitle: string | null;
          hero_image_url: string | null;
          logo_url: string | null;
          favicon_url: string | null;
          sections_order: string[] | null;
          hidden_sections: string[] | null;
          footer_content: string | null;
          custom_css: string | null;
          custom_html: Json;
          settings: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          theme_id: string;
          primary_color?: string;
          secondary_color?: string;
          accent_color?: string;
          font_family?: string;
          hero_title?: string | null;
          hero_subtitle?: string | null;
          hero_image_url?: string | null;
          logo_url?: string | null;
          favicon_url?: string | null;
          sections_order?: string[] | null;
          hidden_sections?: string[] | null;
          footer_content?: string | null;
          custom_css?: string | null;
          custom_html?: Json;
          settings?: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_theme_settings"]["Insert"]>;
      };
      admin_logs: {
        Row: {
          id: string;
          admin_id: string;
          store_id: string | null;
          action: string;
          description: string | null;
          metadata: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          store_id?: string | null;
          action: string;
          description?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_logs"]["Insert"]>;
      };
      domains: {
        Row: {
          id: string;
          store_id: string;
          domain: string;
          is_verified: boolean;
          is_primary: boolean;
          verified_at: string | null;
          dns_records: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          domain: string;
          is_verified?: boolean;
          is_primary?: boolean;
          verified_at?: string | null;
          dns_records?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["domains"]["Insert"]>;
      };
      store_pages: {
        Row: {
          id: string;
          store_id: string;
          title: string;
          slug: string;
          status: "draft" | "published";
          sections_config: Json;
          meta_title: string | null;
          meta_description: string | null;
          show_in_header: boolean;
          show_in_footer: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          title: string;
          slug: string;
          status?: "draft" | "published";
          sections_config?: Json;
          meta_title?: string | null;
          meta_description?: string | null;
          show_in_header?: boolean;
          show_in_footer?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["store_pages"]["Insert"]>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      store_status: StoreStatus;
      subscription_status: SubscriptionStatus;
      order_status: OrderStatus;
      payment_method_type: PaymentMethodType;
      proof_status: ProofStatus;
      shipping_method_type: ShippingMethodType;
      ai_generation_type: AiGenerationType;
      notification_type: NotificationType;
    };
  };
}

// ============================================================
// CONVENIENCE TYPES (Row shortcuts)
// ============================================================
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Package = Database["public"]["Tables"]["packages"]["Row"];
export type Theme = Database["public"]["Tables"]["themes"]["Row"];
export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type PaymentProof = Database["public"]["Tables"]["payment_proofs"]["Row"];
export type AiCredits = Database["public"]["Tables"]["ai_credits"]["Row"];
export type AiGeneration = Database["public"]["Tables"]["ai_generations"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type PaymentMethod = Database["public"]["Tables"]["payment_methods"]["Row"];
export type ShippingMethod = Database["public"]["Tables"]["shipping_methods"]["Row"];
export type ShippingZone = Database["public"]["Tables"]["shipping_zones"]["Row"];
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type StoreThemeSettings = Database["public"]["Tables"]["store_theme_settings"]["Row"];
export type AdminLog = Database["public"]["Tables"]["admin_logs"]["Row"];
export type StorePage = Database["public"]["Tables"]["store_pages"]["Row"];
export type StoreDomain = Database["public"]["Tables"]["domains"]["Row"];

// ============================================================
// EXTENDED TYPES (with relations)
// ============================================================
export type StoreWithPackage = Store & {
  packages: Package | null;
};

export type StoreWithSubscription = Store & {
  subscriptions: Subscription | null;
};

export type DashboardStore = Store & {
  packages: Package | null;
  subscriptions: Subscription | null;
  ai_credits: AiCredits | null;
};

// ============================================================
// API RESPONSE TYPES
// ============================================================
export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type PaginatedResponse<T> = {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// ============================================================
// SUPABASE CLIENT TYPING COMPATIBILITY FIX
// ============================================================
type AddRelationshipsToSchema<T> = {
  [K in keyof T]: T[K] & { Relationships: any[] };
};

export type TypedDatabase = {
  public: {
    Tables: AddRelationshipsToSchema<Database["public"]["Tables"]>;
    Views: Database["public"]["Views"];
    Functions: Database["public"]["Functions"];
    Enums: Database["public"]["Enums"];
  };
};
