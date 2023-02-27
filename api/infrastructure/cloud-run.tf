resource "google_cloud_run_service" "api" {
  name                       = local.name
  location                   = local.gcp_region
  autogenerate_revision_name = true

  template {
    metadata {
      annotations = {
        "run.googleapis.com/cloudsql-instances" = data.terraform_remote_state.shared.outputs.pgsql-db-instance-connection-name
      }
    }

    spec {
      containers {
        image = "eu.gcr.io/smartive-internal-shared/smartive/hack/killer-pool-pwa/killer-pool-api:${var.release_version}"

        resources {
          limits = {
            "memory" = "256Mi"
          }
        }

        ports {
          name           = "http1"
          container_port = 8080
        }

        env {
          name  = "DATABASE_HOST"
          value = "/cloudsql/${data.terraform_remote_state.shared.outputs.pgsql-db-instance-connection-name}"
        }

        env {
          name  = "DATABASE_PORT"
          value = "5432"
        }

        env {
          name  = "DATABASE_NAME"
          value = google_sql_database.db.name
        }

        env {
          name  = "DATABASE_USER"
          value = google_sql_user.db-user.name
        }

        env {
          name  = "DATABASE_PASS"
          value = random_password.database.result
        }

      }

      service_account_name = data.terraform_remote_state.shared.outputs.cloud-runner-email
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "allUsers",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "noauth" {
  location = google_cloud_run_service.api.location
  project  = google_cloud_run_service.api.project
  service  = google_cloud_run_service.api.name

  policy_data = data.google_iam_policy.noauth.policy_data
}
