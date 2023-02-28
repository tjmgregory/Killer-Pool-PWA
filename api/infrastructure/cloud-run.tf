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
          name           = "h2c"
          container_port = 8000
        }

        env {
          name  = "PUSH_SUBJECT"
          value = "mailto: <test@foobar.dev>"
        }

        env {
          name  = "PUSH_PUBLIC_KEY"
          value = var.push_public
        }

        env {
          name  = "PUSH_PRIVATE_KEY"
          value = var.push_private
        }

        env {
          name  = "ROCKET_DATABASES"
          value = "{data={url=\"postgres://${google_sql_user.db-user.name}:${random_password.database.result}@${google_sql_database.db.name}?host=/cloudsql/${data.terraform_remote_state.shared.outputs.pgsql-db-instance-connection-name}\"}}"
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
