/*
 * Copyright (c) 2023 Airbyte, Inc., all rights reserved.
 */

package io.airbyte.workers.process;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.BuildImageResultCallback;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;
import com.github.dockerjava.transport.DockerHttpClient;
import io.airbyte.commons.string.Strings;
import io.airbyte.config.ResourceRequirements;
import io.fabric8.kubernetes.api.model.ContainerBuilder;
import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.PodBuilder;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClient;
import java.io.File;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.testcontainers.shaded.com.github.dockerjava.core.DefaultDockerClientConfig;
import org.testcontainers.shaded.com.github.dockerjava.core.DockerClientConfig;
import org.testcontainers.shaded.com.github.dockerjava.core.DockerClientImpl;
import org.testcontainers.shaded.com.google.common.io.Resources;

class KubePodProcessTest {

  private static final String CPU = "cpu";
  private static final String MEMORY = "memory";

  @Test
  @DisplayName("Should build resource requirements.")
  void testBuildResourceRequirements() {
    final var reqs = KubePodProcess.getResourceRequirementsBuilder(new ResourceRequirements()
        .withCpuRequest("1")
        .withCpuLimit("2")
        .withMemoryRequest("1000Mi")
        .withMemoryLimit("1Gi"));
    final var actualReqs = reqs.build();

    assertEquals(new Quantity("1"), actualReqs.getRequests().get(CPU));
    assertEquals(new Quantity("2"), actualReqs.getLimits().get(CPU));
    assertEquals(new Quantity("1000Mi"), actualReqs.getRequests().get(MEMORY));
    assertEquals(new Quantity("1Gi"), actualReqs.getLimits().get(MEMORY));
  }

  @Test
  @DisplayName("Should build resource requirements with partial infos.")
  void testBuildResourceRequirementsWithPartialInfo() {
    final var reqs = KubePodProcess.getResourceRequirementsBuilder(new ResourceRequirements()
        .withCpuRequest("5")
        .withMemoryLimit("4Gi"));
    final var actualReqs = reqs.build();

    assertEquals(new Quantity("5"), actualReqs.getRequests().get(CPU));
    assertNull(actualReqs.getLimits().get(CPU));
    assertNull(actualReqs.getRequests().get(MEMORY));
    assertEquals(new Quantity("4Gi"), actualReqs.getLimits().get(MEMORY));
  }

  @Test
  @DisplayName("Should build resource requirements that don't have conflicts.")
  void testBuildResourceRequirementsShouldEnsureRequestFitsWithinLimits() {
    final var reqs = KubePodProcess.getResourceRequirementsBuilder(new ResourceRequirements()
        .withCpuRequest("1")
        .withCpuLimit("0.5")
        .withMemoryRequest("1000Mi")
        .withMemoryLimit("0.5Gi"));
    final var actualReqs = reqs.build();

    assertEquals(new Quantity("0.5"), actualReqs.getRequests().get(CPU));
    assertEquals(new Quantity("0.5"), actualReqs.getLimits().get(CPU));
    assertEquals(new Quantity("0.5Gi"), actualReqs.getRequests().get(MEMORY));
    assertEquals(new Quantity("0.5Gi"), actualReqs.getLimits().get(MEMORY));
  }

  // Disabled until we start minikube on the node.
  @Disabled
  @Nested
  class GetPodIp {

    private static final KubernetesClient K8s = new DefaultKubernetesClient();

    private static final String TEST_IMAGE_WITH_VAR_PATH = "Dockerfile.with_var";
    private static final String TEST_IMAGE_WITH_VAR_NAME = "worker-test:with-var";

    private static final String TEST_IMAGE_NO_VAR_PATH = "Dockerfile.no_var";
    private static final String TEST_IMAGE_NO_VAR_NAME = "worker-test:no-var";

    private class DockerUtils {

      private static final DockerClientConfig CONFIG = DefaultDockerClientConfig.createDefaultConfigBuilder().build();
      private static final DockerHttpClient HTTP_CLIENT = new ApacheDockerHttpClient.Builder()
          .dockerHost(CONFIG.getDockerHost())
          .sslConfig(CONFIG.getSSLConfig())
          .maxConnections(100)
          .build();
      private static final DockerClient DOCKER_CLIENT = DockerClientImpl.getInstance(CONFIG, HTTP_CLIENT);

      public static String buildImage(final String dockerFilePath, final String tag) {
        return DOCKER_CLIENT.buildImageCmd()
            .withDockerfile(new File(dockerFilePath))
            .withTags(Set.of(tag))
            .exec(new BuildImageResultCallback())
            .awaitImageId();
      }

    }

    @BeforeAll
    static void setup() {
      final var varDockerfile = Resources.getResource(TEST_IMAGE_WITH_VAR_PATH);
      DockerUtils.buildImage(varDockerfile.getPath(), TEST_IMAGE_WITH_VAR_NAME);

      final var noVarDockerfile = Resources.getResource(TEST_IMAGE_NO_VAR_PATH);
      DockerUtils.buildImage(noVarDockerfile.getPath(), TEST_IMAGE_NO_VAR_NAME);
    }

    @Test
    @DisplayName("Should error when the given pod does not exists.")
    void testGetPodIpNoPod() {
      assertThrows(RuntimeException.class, () -> KubePodProcess.getPodIP(K8s, "pod-does-not-exist", "default"));
    }

    @Test
    @DisplayName("Should return the correct pod ip.")
    void testGetPodIpGoodPod() throws InterruptedException {
      final var sleep = new ContainerBuilder()
          .withImage("busybox")
          .withName("sleep")
          .withCommand("sleep", "100000")
          .build();

      final var podName = Strings.addRandomSuffix("test-get-pod-good-pod", "-", 5);
      final Pod podDef = new PodBuilder()
          .withApiVersion("v1")
          .withNewMetadata()
          .withName(podName)
          .endMetadata()
          .withNewSpec()
          .withRestartPolicy("Never")
          .withRestartPolicy("Never")
          .withContainers(sleep)
          .endSpec()
          .build();

      final String namespace = "default";
      final Pod pod = K8s.pods().inNamespace(namespace).createOrReplace(podDef);
      K8s.resource(pod).waitUntilReady(20, TimeUnit.SECONDS);

      final var ip = KubePodProcess.getPodIP(K8s, podName, namespace);
      final var exp = K8s.pods().inNamespace(namespace).withName(podName).get().getStatus().getPodIP();
      assertEquals(exp, ip);
      K8s.resource(podDef).inNamespace(namespace).delete();
    }

  }

}
