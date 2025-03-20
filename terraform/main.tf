provider "google" {
  project     = "myproject2203" 
  region      = "us-central1"
  zone        = "us-central1-a"
  credentials = file("myproject2203-6028ec717602.json") 
}

resource "google_container_cluster" "primary" {
  name               = "kubernetes-assignment-cluster"
  location           = "us-central1-a"
  initial_node_count = 1
  deletion_protection = false

  node_config {
    machine_type = "e2-medium" 
    disk_size_gb = 200
    disk_type    = "pd-standard"
    image_type   = "cos_containerd" 
    service_account = "clouda3@myproject2203.iam.gserviceaccount.com"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}

# resource "google_artifact_registry_repository" "my-repo" {
#   location      = "us-central1"
#   repository_id = "kubernetes-assignment"
#   format        = "DOCKER"
#   description   = "Docker repository for Kubernetes assignment"
# }

output "kubernetes_cluster_name" {
  value = google_container_cluster.primary.name
}

output "kubernetes_cluster_endpoint" {
  value = google_container_cluster.primary.endpoint
}

# output "artifact_registry_repository_url" {
#   value = "${google_artifact_registry_repository.my-repo.location}-docker.pkg.dev/${google_container_cluster.primary.project}/kubernetes-assignment"
# }

output "gcloud_container_clusters_get_credentials_command" {
  value = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --zone ${google_container_cluster.primary.location} --project myproject2203"
}