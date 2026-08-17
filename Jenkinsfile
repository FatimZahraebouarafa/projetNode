pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'docker.io'

        DOCKER_IMAGE_BACKEND = 'fatimzahraebouarafa/rabta-backend'
        DOCKER_IMAGE_FRONTEND = 'fatimzahraebouarafa/rabta-frontend'

    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm

                echo "================================"
                echo "Branch: ${env.BRANCH_NAME}"
                echo "Build: ${env.BUILD_NUMBER}"
                echo "================================"
            }
        }

        stage('Tests') {
            parallel {

                stage('Backend Tests') {
                    steps {
                        echo 'No backend tests configured yet.'
                    }
                }

                stage('Frontend Tests') {
                    steps {
                        echo 'No frontend tests configured yet.'
                    }
                }
            }
        }

        stage('Build Docker Images') {
            parallel {

                stage('Build Backend Image') {
                    steps {
                        script {
                            docker.build(
                                "${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}",
                                "./backend"
                            )
                        }
                    }
                }

                stage('Build Frontend Image') {
                    steps {
                        script {
                            docker.build(
                                "${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}",
                                "./frontend"
                            )
                        }
                    }
                }
            }
        }

        stage('Push Docker Images') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }

            steps {
                script {

                    docker.withRegistry(
                        "https://${DOCKER_REGISTRY}",
                        'docker-registry-credentials'
                    ) {

                        docker.image(
                            "${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}"
                        ).push()

                        docker.image(
                            "${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}"
                        ).push()

                        docker.image(
                            "${DOCKER_IMAGE_BACKEND}:${BUILD_NUMBER}"
                        ).push('latest')

                        docker.image(
                            "${DOCKER_IMAGE_FRONTEND}:${BUILD_NUMBER}"
                        ).push('latest')
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }

            steps {
                sh '''
                    docker compose down
                    docker compose up -d
                '''
            }
        }

        stage('Health Check') {
            when {
                anyOf {
                    branch 'main'
                    branch 'master'
                }
            }

            steps {
                script {

                    retry(5) {

                        sleep(time: 10, unit: 'SECONDS')

                        sh '''
                            curl -f http://localhost:3001
                        '''
                    }
                }
            }
        }
    }

    post {

        success {
            echo "================================"
            echo "CI/CD PIPELINE SUCCESS"
            echo "Application deployed successfully."
            echo "================================"
        }

        failure {
            echo "================================"
            echo "CI/CD PIPELINE FAILED"
            echo "Check the Jenkins logs."
            echo "================================"
        }

        always {
            echo "Cleaning Jenkins workspace..."

            cleanWs()
        }
    }
}