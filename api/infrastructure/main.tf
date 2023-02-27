locals {
  name       = "killer-pool-pwa"
  gcp_region = "europe-west6"
}

provider "google" {
  project = "smartive-internal-shared"
  region  = local.gcp_region
}

provider "random" {
}

data "google_project" "project" {
}

data "terraform_remote_state" "shared" {
  backend = "http"
  config = {
    address  = "https://gitlab.com/api/v4/projects/35159948/terraform/state/shared"
    username = "smartive_ci"
  }
}

terraform {
  backend "gcs" {
    bucket = "smartive-internal-terraform-states"
    prefix = "killer-pool-pwa/"
  }
}
